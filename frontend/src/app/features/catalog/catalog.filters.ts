import { editorialOrder } from '../../core/data/movie-artwork';
import { MovieView } from '../../core/models/movie.model';

export interface CatalogFilters {
  query: string;
  genre: string;
  releaseYear: string;
  sort: string;
  watchlistIds?: readonly string[];
}

interface SearchCriteria {
  query: string;
  genre: string;
  releaseYear: string;
  watchlistIds?: ReadonlySet<string>;
}

type MovieComparator = (first: MovieView, second: MovieView) => number;

export function filterMovies(movies: readonly MovieView[], filters: CatalogFilters): MovieView[] {
  const criteria: SearchCriteria = {
    query: normalizeSearchText(filters.query.trim()),
    genre: filters.genre,
    releaseYear: filters.releaseYear,
    watchlistIds: filters.watchlistIds ? new Set(filters.watchlistIds) : undefined,
  };

  return movies
    .filter((movie) => matchesMovie(movie, criteria))
    .sort(getMovieComparator(filters.sort));
}

function matchesMovie(movie: MovieView, criteria: SearchCriteria): boolean {
  return (
    (!criteria.watchlistIds || criteria.watchlistIds.has(movie.id)) &&
    (!criteria.genre || movie.genres.includes(criteria.genre)) &&
    (!criteria.releaseYear || movie.releaseYear === Number(criteria.releaseYear)) &&
    matchesSearchQuery(movie, criteria.query)
  );
}

function matchesSearchQuery(movie: MovieView, query: string): boolean {
  const searchableText = [movie.title, movie.releaseYear, ...movie.genres, ...movie.actors].join(
    ' ',
  );
  return !query || normalizeSearchText(searchableText).includes(query);
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getMovieComparator(sort: string): MovieComparator {
  switch (sort) {
    case 'api':
      return () => 0;
    case 'recent':
      return (first, second) =>
        (second.releaseYear ?? 0) - (first.releaseYear ?? 0) ||
        first.title.localeCompare(second.title);
    case 'oldest':
      return (first, second) =>
        (first.releaseYear ?? 0) - (second.releaseYear ?? 0) ||
        first.title.localeCompare(second.title);
    case 'title':
      return (first, second) => first.title.localeCompare(second.title, 'fr');
    default:
      return compareEditorialOrder;
  }
}

function compareEditorialOrder(first: MovieView, second: MovieView): number {
  return (
    editorialRank(first.id) - editorialRank(second.id) ||
    first.title.localeCompare(second.title, 'fr')
  );
}

function editorialRank(movieId: string): number {
  const position = editorialOrder.indexOf(movieId);
  return position < 0 ? 100 : position;
}
