import { HeroSliderComponent } from './hero-slider/hero-slider.component';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { map } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageMotionDirective, ScrollRevealDirective } from '../../shared/motion.directives';

import { filterMovies } from './catalog.filters';
import { GenreCardComponent } from './genres/genre-card.component';
import { genreProfiles, genreImage } from './genres/genre.data';

@Component({
  selector: 'nfx-catalog-page',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    MovieCardComponent,
    IconComponent,
    HeroSliderComponent,
    PageMotionDirective,
    ScrollRevealDirective,
    GenreCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.css',
})
export class CatalogPage {
  readonly catalog = inject(CatalogService);
  readonly watchlist = inject(WatchlistService);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  readonly mode = toSignal(this.route.data.pipe(map((data) => String(data['mode'] || 'explore'))), {
    initialValue: 'explore',
  });
  private readonly genreSlug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('genre'))),
  );
  readonly activeGenre = computed(() =>
    genreProfiles.find((profile) => profile.slug === this.genreSlug()),
  );
  readonly activeGenreImage = computed(() => {
    const profile = this.activeGenre();
    return profile ? genreImage(profile) : undefined;
  });
  readonly bannerFailed = signal(false);
  readonly genreCards = computed(() => {
    const available = new Set(this.catalog.genres());
    return genreProfiles.filter((profile) => available.has(profile.name));
  });
  readonly pageKey = computed(() => this.mode() + (this.genreSlug() ?? ''));
  readonly immersive = computed(() => this.mode() === 'explore' && !this.catalog.search());
  readonly genre = signal('');
  readonly year = signal('');
  readonly sort = signal('selection');
  readonly limit = signal(this.catalog.isTmdb ? 20 : 10);
  readonly pageLoading = computed(() =>
    this.mode() === 'watchlist' ? this.catalog.savedLoading() : this.catalog.loading(),
  );
  readonly pageError = computed(() =>
    this.mode() === 'watchlist'
      ? this.catalog.savedError() && !this.catalog.savedMovies().length
      : this.catalog.error(),
  );
  readonly skeletons = [1, 2, 3, 4, 5];
  readonly popularGenres = computed(() =>
    ['Science-fiction', 'Action', 'Drame', 'Animation', 'Thriller'].filter((genre) =>
      this.catalog.genres().includes(genre),
    ),
  );
  readonly featuredMovies = computed(() => {
    const movies = ['demo-interstellar', 'demo-inception', 'demo-the-matrix']
      .map((id) => this.catalog.movies().find((movie) => movie.id === id))
      .filter((movie) => movie !== undefined);
    return movies.length ? movies : this.catalog.movies().slice(0, 3);
  });
  readonly filteredMovies = computed(() =>
    filterMovies(this.mode() === 'watchlist' ? this.catalog.savedMovies() : this.catalog.movies(), {
      query: this.catalog.isTmdb && this.mode() !== 'watchlist' ? '' : this.catalog.search(),
      genre: this.genre(),
      releaseYear: this.year(),
      sort:
        this.catalog.isTmdb &&
        this.mode() !== 'watchlist' &&
        (!this.catalog.search().trim() || this.sort() === 'selection')
          ? 'api'
          : this.sort(),
      watchlistIds: this.mode() === 'watchlist' ? this.watchlist.ids() : undefined,
    }),
  );
  readonly visibleMovies = computed(() =>
    this.filteredMovies().slice(0, this.mode() === 'watchlist' ? undefined : this.limit()),
  );
  constructor() {
    effect(() => {
      const mode = this.mode();
      const profile = this.activeGenre();
      if (mode === 'genre' || mode === 'genres') {
        this.genre.set(mode === 'genre' ? (profile?.name ?? '') : '');
        this.year.set('');
        this.sort.set('selection');
        this.catalog.search.set('');
        this.bannerFailed.set(false);
      }
      if (mode === 'genre' && profile) this.title.setTitle(`${profile.name} · Neo4flix`);
    });
    effect(() => {
      const filters = { genre: this.genre(), year: this.year(), sort: this.sort() };
      if (this.mode() !== 'watchlist' && this.catalog.isTmdb)
        untracked(() => this.catalog.setFilters(filters));
    });
  }
  selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
  resetFilters(): void {
    this.genre.set(this.mode() === 'genre' ? (this.activeGenre()?.name ?? '') : '');
    this.year.set('');
    this.catalog.search.set('');
  }
  retry(): void {
    if (this.mode() === 'watchlist') this.catalog.reloadSaved();
    else this.catalog.load();
  }
}
