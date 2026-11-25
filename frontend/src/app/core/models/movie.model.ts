export interface Movie {
  id: string;
  title: string;
  releaseYear: number | null;
  genres: string[];
  actors: string[];
}

export interface MovieArtwork {
  poster?: string;
  backdrop?: string;
  duration?: string;
  description?: string;
  tmdbId?: number;
}

export type MovieView = Movie & MovieArtwork;
