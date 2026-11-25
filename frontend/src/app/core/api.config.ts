export const API_ENDPOINTS = {
  movies: '/api/movies',
  login: '/api/auth/login',
  register: '/api/auth/register',
  refresh: '/api/auth/refresh',
  tmdb: '/api/tmdb',
} as const;

export const API_REQUEST_TIMEOUT_MS = 12_000;

export const CATALOG_CONFIG = {
  source: 'tmdb' as 'tmdb' | 'neo4flix',
  language: 'fr-FR',
};
