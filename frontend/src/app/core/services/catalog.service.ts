import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  Subscription,
  catchError,
  finalize,
  from,
  map,
  mergeMap,
  of,
  shareReplay,
  switchMap,
  tap,
  timeout,
  toArray,
} from 'rxjs';
import { API_ENDPOINTS, API_REQUEST_TIMEOUT_MS, CATALOG_CONFIG } from '../api.config';
import { enrichMovie } from '../data/movie-artwork';
import { Movie, MovieView } from '../models/movie.model';
import { CatalogQuery } from '../models/tmdb.model';
import { TmdbService } from './tmdb.service';
import { WatchlistService } from './watchlist.service';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly tmdb = inject(TmdbService);
  private readonly watchlist = inject(WatchlistService);
  readonly isTmdb = CATALOG_CONFIG.source === 'tmdb';
  private readonly moviesState = signal<MovieView[]>([]);
  readonly movies = this.moviesState.asReadonly();
  private readonly loadingState = signal(false);
  readonly loading = this.loadingState.asReadonly();
  private readonly errorState = signal(false);
  readonly error = this.errorState.asReadonly();
  readonly search = signal('');
  private readonly filtersState = signal({ genre: '', year: '', sort: 'selection' });
  private readonly genreNamesState = signal<string[]>([]);
  private readonly pageState = signal(0);
  readonly page = this.pageState.asReadonly();
  private readonly totalPagesState = signal(0);
  readonly totalPages = this.totalPagesState.asReadonly();
  private readonly totalResultsState = signal(0);
  readonly totalResults = this.totalResultsState.asReadonly();
  readonly hasNextPage = computed(() => this.page() < this.totalPages());
  readonly hasPreviousPage = computed(() => this.page() > 1);
  private readonly cacheState = signal(this.readCache());
  readonly savedMovies = computed(() =>
    this.watchlist
      .ids()
      .map((id) => this.cacheState().get(id))
      .filter((movie): movie is MovieView => Boolean(movie)),
  );
  private readonly savedLoadingState = signal(false);
  readonly savedLoading = this.savedLoadingState.asReadonly();
  private readonly savedErrorState = signal(false);
  readonly savedError = this.savedErrorState.asReadonly();
  private readonly savedReload = signal(0);
  readonly genres = computed(() =>
    this.isTmdb
      ? this.genreNamesState()
      : [...new Set(this.movies().flatMap((movie) => movie.genres))].sort((a, b) =>
          a.localeCompare(b, 'fr'),
        ),
  );
  readonly years = computed(() =>
    this.isTmdb
      ? Array.from(
          { length: new Date().getFullYear() - 1900 + 2 },
          (_, index) => new Date().getFullYear() + 1 - index,
        )
      : [
          ...new Set(
            this.movies()
              .map((movie) => movie.releaseYear)
              .filter((year): year is number => year !== null),
          ),
        ].sort((a, b) => b - a),
  );
  private query: CatalogQuery = { query: '', genre: '', year: '', sort: 'selection' };
  private activeRequest?: Subscription;
  private debounce?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private backendSnapshot?: Observable<Movie[]>;
  private readonly detailRequests = new Map<string, Observable<MovieView | undefined>>();
  private readonly detailedIds = new Set<string>();

  constructor() {
    if (this.isTmdb) {
      effect(() => {
        const query = { query: this.search().trim(), ...this.filtersState() };
        untracked(() => this.schedule(query));
      });
    } else this.load();

    effect((onCleanup) => {
      const ids = this.watchlist.ids();
      this.savedReload();
      const missing = untracked(() => ids.filter((id) => !this.cacheState().has(id)));
      this.savedErrorState.set(false);
      this.savedLoadingState.set(missing.length > 0);
      const request = from(missing)
        .pipe(
          mergeMap(
            (id) =>
              this.getMovie(id).pipe(
                catchError(() => {
                  this.savedErrorState.set(true);
                  return of(undefined);
                }),
              ),
            4,
          ),
          finalize(() => this.savedLoadingState.set(false)),
        )
        .subscribe((movie) => {
          if (!movie) this.savedErrorState.set(true);
        });
      onCleanup(() => request.unsubscribe());
    });
  }

  setFilters(filters: { genre: string; year: string; sort: string }): void {
    const previous = this.filtersState();
    if (
      previous.genre !== filters.genre ||
      previous.year !== filters.year ||
      previous.sort !== filters.sort
    )
      this.filtersState.set(filters);
  }

  load(): void {
    if (this.loading()) return;
    clearTimeout(this.debounce);
    if (this.isTmdb) this.fetchPage(Math.max(1, this.page()));
    else {
      this.loadingState.set(true);
      this.errorState.set(false);
      this.backendSnapshot = undefined;
      this.activeRequest = this.backendMovies()
        .pipe(
          switchMap((movies) =>
            from(movies).pipe(
              mergeMap((movie) => this.tmdb.enrich(enrichMovie(movie)), 4),
              toArray(),
            ),
          ),
          finalize(() => this.loadingState.set(false)),
        )
        .subscribe({
          next: (movies) => {
            this.moviesState.set(movies);
            this.remember(movies);
          },
          error: () => this.errorState.set(true),
        });
    }
  }

  nextPage(): void {
    if (!this.loading() && this.hasNextPage()) this.fetchPage(this.page() + 1);
  }
  previousPage(): void {
    if (!this.loading() && this.hasPreviousPage()) this.fetchPage(this.page() - 1);
  }
  reloadSaved(): void {
    this.savedReload.update((value) => value + 1);
  }

  getMovie(id: string): Observable<MovieView | undefined> {
    const cached = untracked(() => this.cacheState().get(id));
    if (cached && this.detailedIds.has(id)) return of(cached);
    const inFlight = this.detailRequests.get(id);
    if (inFlight) return inFlight;
    const match = /^tmdb-(\d+)$/.exec(id);
    const tmdbId = match ? Number(match[1]) : undefined;
    if (tmdbId !== undefined && (!Number.isSafeInteger(tmdbId) || tmdbId < 1)) return of(undefined);
    const movie = tmdbId
      ? this.tmdb.getMovie(tmdbId)
      : this.backendMovies().pipe(
          switchMap((movies) => {
            const found = movies.find((movie) => movie.id === id);
            return found ? this.tmdb.enrich(enrichMovie(found)) : of(undefined);
          }),
        );
    const request = movie.pipe(
      tap((result) => {
        if (result) {
          this.detailedIds.add(id);
          this.remember([result]);
        }
      }),
      finalize(() => this.detailRequests.delete(id)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.detailRequests.set(id, request);
    return request;
  }

  similarMovies(movie: MovieView): Observable<MovieView[]> {
    if (movie.tmdbId)
      return this.tmdb.getSimilar(movie.tmdbId).pipe(
        tap((movies) => this.remember(movies)),
        catchError(() => of([])),
      );
    return of(
      this.movies()
        .filter(
          (other) =>
            other.id !== movie.id && other.genres.some((genre) => movie.genres.includes(genre)),
        )
        .slice(0, 5),
    );
  }

  private schedule(query: CatalogQuery): void {
    this.query = query;
    clearTimeout(this.debounce);
    this.generation++;
    this.activeRequest?.unsubscribe();
    this.loadingState.set(true);
    this.errorState.set(false);
    this.debounce = setTimeout(() => this.fetchPage(1), query.query ? 280 : 0);
  }

  private fetchPage(page: number): void {
    const generation = ++this.generation;
    this.activeRequest?.unsubscribe();
    this.loadingState.set(true);
    this.errorState.set(false);
    this.activeRequest = this.tmdb.genres
      .pipe(
        tap((genres) =>
          this.genreNamesState.set(
            genres.map((genre) => genre.name).sort((a, b) => a.localeCompare(b, 'fr')),
          ),
        ),
        switchMap(() => this.tmdb.getPage(this.query, page)),
        finalize(() => {
          if (generation === this.generation) this.loadingState.set(false);
        }),
      )
      .subscribe({
        next: (result) => {
          this.moviesState.set(result.movies);
          this.pageState.set(result.page);
          this.totalPagesState.set(result.totalPages);
          this.totalResultsState.set(result.totalResults);
          this.remember(result.movies);
        },
        error: () => this.errorState.set(true),
      });
  }

  private backendMovies(): Observable<Movie[]> {
    if (!this.backendSnapshot)
      this.backendSnapshot = this.http.get<Movie[]>(API_ENDPOINTS.movies).pipe(
        timeout(API_REQUEST_TIMEOUT_MS),
        map((movies) => {
          if (!Array.isArray(movies)) throw new Error('Invalid catalog response');
          return movies;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.backendSnapshot;
  }

  private remember(movies: MovieView[]): void {
    const cache = new Map(untracked(() => this.cacheState()));
    movies.forEach((movie) => {
      const previous = cache.get(movie.id);
      cache.delete(movie.id);
      cache.set(movie.id, {
        ...movie,
        actors: movie.actors.length ? movie.actors : (previous?.actors ?? []),
        duration: movie.duration ?? previous?.duration,
      });
    });
    this.cacheState.set(cache);
    const saved = new Set(untracked(() => this.watchlist.ids()));
    const recent = [...cache.values()].slice(-150);
    const values = new Map<string, MovieView>(
      [...cache.values()].filter((movie) => saved.has(movie.id)).map((movie) => [movie.id, movie]),
    );
    recent.forEach((movie) => values.set(movie.id, movie));
    try {
      localStorage.setItem('neo4flix.movie-cache', JSON.stringify([...values.values()]));
    } catch {
      /* Keep the cache in memory. */
    }
  }

  private readCache(): Map<string, MovieView> {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('neo4flix.movie-cache') ?? '[]');
      if (!Array.isArray(stored)) return new Map();
      const movies = stored.filter(
        (movie): movie is MovieView =>
          movie &&
          typeof movie.id === 'string' &&
          typeof movie.title === 'string' &&
          Array.isArray(movie.genres) &&
          Array.isArray(movie.actors),
      );
      return new Map(movies.map((movie) => [movie.id, movie]));
    } catch {
      return new Map();
    }
  }
}
