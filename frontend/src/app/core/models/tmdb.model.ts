export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  genres?: TmdbGenre[];
  runtime?: number;
  adult?: boolean;
  credits?: { cast: { name: string; order: number }[] };
}

export interface TmdbPage {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovie[];
}

export interface TmdbConfiguration {
  images: {
    secure_base_url: string;
    poster_sizes: string[];
    backdrop_sizes: string[];
  };
}

export interface CatalogQuery {
  query: string;
  genre: string;
  year: string;
  sort: string;
}
