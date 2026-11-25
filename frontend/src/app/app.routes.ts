import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Explorer · Neo4flix',
    loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
    data: { mode: 'explore' },
  },
  {
    path: 'ma-liste',
    title: 'Ma liste · Neo4flix',
    loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
    data: { mode: 'watchlist' },
  },
  {
    path: 'genres',
    title: 'Les genres · Neo4flix',
    loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
    data: { mode: 'genres' },
  },
  {
    path: 'genres/:genre',
    title: 'Votre univers · Neo4flix',
    loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
    data: { mode: 'genre' },
  },
  {
    path: 'films/:id',
    title: 'Le film · Neo4flix',
    loadComponent: () => import('./features/movies/movie.page').then((m) => m.MoviePage),
  },
  {
    path: 'connexion',
    title: 'Connexion · Neo4flix',
    loadComponent: () => import('./features/auth/auth.page').then((m) => m.AuthPage),
    data: { mode: 'login' },
  },
  {
    path: 'inscription',
    title: 'Inscription · Neo4flix',
    loadComponent: () => import('./features/auth/auth.page').then((m) => m.AuthPage),
    data: { mode: 'register' },
  },
  { path: '**', redirectTo: '' },
];
