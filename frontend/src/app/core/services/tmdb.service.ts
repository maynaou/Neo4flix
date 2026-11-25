import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap, timeout } from 'rxjs';
import { API_ENDPOINTS, API_REQUEST_TIMEOUT_MS, CATALOG_CONFIG } from '../api.config';
import { MovieView } from '../models/movie.model';
import {
  CatalogQuery,
  TmdbConfiguration,
  TmdbGenre,
  TmdbMovie,
  TmdbPage,
} from '../models/tmdb.model';

export interface MoviePageResult {
  movies: MovieView[];
  page: number;
  totalPages: number;
  totalResults: number;
}

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private readonly http = inject(HttpClient);
  private readonly configuration = this.get<TmdbConfiguration>('configuration').pipe(
    shareReplay({ bufferSize: 1, refCount: false }),
  );
  readonly genres = this.get<{ genres: TmdbGenre[] }>('genre/movie/list').pipe(
    map((response) =>
      response.genres.map((genre) => ({ ...genre, name: this.genreName(genre.name) })),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  getPage(query: CatalogQuery, page: number): Observable<MoviePageResult> {
    return this.genres.pipe(
      switchMap((genres) => {
        const genreId = genres.find((genre) => genre.name === query.genre)?.id;
        let params = new HttpParams().set('page', page).set('include_adult', false);
        let endpoint = 'movie/popular';

        if (query.query) {
          endpoint = 'search/movie';
          params = params.set('query', query.query);
          if (query.year) params = params.set('primary_release_year', query.year);
        } else if (query.genre || query.year || query.sort !== 'selection') {
          endpoint = 'discover/movie';
          if (genreId) params = params.set('with_genres', genreId);
          if (query.year) params = params.set('primary_release_year', query.year);
          const order: Record<string, string> = {
            selection: 'popularity.desc',
            title: 'original_title.asc',
            recent: 'primary_release_date.desc',
            oldest: 'primary_release_date.asc',
          };
          params = params.set('sort_by', order[query.sort] ?? 'popularity.desc');
        }

        return forkJoin({
          configuration: this.configuration,
          response: this.get<TmdbPage>(endpoint, params),
        }).pipe(
          map(({ configuration, response }) => ({
            movies: response.results
              .filter((movie) => !movie.adult)
              .filter((movie) => !query.query || !genreId || movie.genre_ids?.includes(genreId))
              .map((movie) => this.toMovie(movie, configuration, genres)),
            page: response.page,
            totalPages: Math.min(response.total_pages, 500),
            totalResults: response.total_results,
          })),
        );
      }),
    );
  }

  getMovie(id: number): Observable<MovieView> {
    return forkJoin({
      movie: this.get<TmdbMovie>(
        `movie/${id}`,
        new HttpParams().set('append_to_response', 'credits'),
      ),
      configuration: this.configuration,
      genres: this.genres,
    }).pipe(map(({ movie, configuration, genres }) => this.toMovie(movie, configuration, genres)));
  }

  getSimilar(id: number): Observable<MovieView[]> {
    return forkJoin({
      response: this.get<TmdbPage>(`movie/${id}/similar`),
      configuration: this.configuration,
      genres: this.genres,
    }).pipe(
      map(({ response, configuration, genres }) =>
        response.results
          .filter((movie) => !movie.adult)
          .slice(0, 5)
          .map((movie) => this.toMovie(movie, configuration, genres)),
      ),
    );
  }

  enrich(movie: MovieView): Observable<MovieView> {
    return this.get<TmdbPage>(
      'search/movie',
      new HttpParams()
        .set('query', movie.title)
        .set('include_adult', false)
        .set('primary_release_year', movie.releaseYear ?? ''),
    ).pipe(
      switchMap((response) => {
        const candidates = response.results.filter((result) => !result.adult);
        const exact = candidates.find((result) =>
          [result.title, result.original_title ?? ''].some(
            (title) => this.normalize(title) === this.normalize(movie.title),
          ),
        );
        const match =
          exact ??
          candidates.find((result) => result.release_date?.startsWith(String(movie.releaseYear)));
        return match
          ? this.getMovie(match.id).pipe(
              map((details) => ({
                ...movie,
                poster: details.poster ?? movie.poster,
                backdrop: details.backdrop ?? movie.backdrop,
                description: details.description ?? movie.description,
                duration: details.duration ?? movie.duration,
                tmdbId: details.tmdbId,
              })),
            )
          : of(movie);
      }),
      catchError(() => of(movie)),
    );
  }

  private get<T>(path: string, params = new HttpParams()): Observable<T> {
    return this.http
      .get<T>(`${API_ENDPOINTS.tmdb}/${path}`, {
        params: params.set('language', CATALOG_CONFIG.language),
      })
      .pipe(timeout(API_REQUEST_TIMEOUT_MS));
  }

  private toMovie(
    movie: TmdbMovie,
    configuration: TmdbConfiguration,
    genres: TmdbGenre[],
  ): MovieView {
    const releaseYear = movie.release_date ? Number(movie.release_date.slice(0, 4)) : null;
    const image = (path: string | null | undefined, size: string) =>
      path ? `${configuration.images.secure_base_url}${size}${path}` : undefined;
    const duration =
      movie.runtime && movie.runtime > 0
        ? `${Math.floor(movie.runtime / 60)} h ${String(movie.runtime % 60).padStart(2, '0')}`
        : undefined;
    return {
      id: `tmdb-${movie.id}`,
      tmdbId: movie.id,
      title: movie.title,
      releaseYear: Number.isFinite(releaseYear) ? releaseYear : null,
      genres:
        movie.genres?.map((genre) => this.genreName(genre.name)) ??
        (movie.genre_ids ?? [])
          .map((id) => genres.find((genre) => genre.id === id)?.name)
          .filter((name): name is string => Boolean(name)),
      actors: movie.credits?.cast.slice(0, 12).map((actor) => actor.name) ?? [],
      description: movie.overview?.trim() || undefined,
      duration,
      poster: image(
        movie.poster_path,
        configuration.images.poster_sizes.includes('w500') ? 'w500' : 'original',
      ),
      backdrop: image(
        movie.backdrop_path,
        configuration.images.backdrop_sizes.includes('w1280') ? 'w1280' : 'original',
      ),
    };
  }

  private genreName(name: string): string {
    return name === 'Science-Fiction' ? 'Science-fiction' : name;
  }
  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
