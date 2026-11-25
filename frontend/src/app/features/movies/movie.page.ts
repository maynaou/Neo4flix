import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MovieView } from '../../core/models/movie.model';
import { CatalogService } from '../../core/services/catalog.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { ToastService } from '../../core/services/toast.service';
import { MovieCardComponent } from '../../shared/movie-card/movie-card.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageMotionDirective, ScrollRevealDirective } from '../../shared/motion.directives';

@Component({
  selector: 'nfx-movie-page',
  imports: [
    RouterLink,
    MovieCardComponent,
    IconComponent,
    PageMotionDirective,
    ScrollRevealDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './movie.page.html',
})
export class MoviePage {
  readonly catalog = inject(CatalogService);
  readonly watchlist = inject(WatchlistService);
  private readonly toast = inject(ToastService);
  private readonly title = inject(Title);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  private readonly movieState = signal<MovieView | undefined>(undefined);
  readonly movie = this.movieState.asReadonly();
  private readonly loadingState = signal(false);
  readonly loading = this.loadingState.asReadonly();
  private readonly errorState = signal(false);
  readonly error = this.errorState.asReadonly();
  private readonly relatedState = signal<MovieView[]>([]);
  readonly similarMovies = this.relatedState.asReadonly();
  private readonly retry = signal(0);

  constructor() {
    effect((onCleanup) => {
      const id = this.params()?.get('id');
      this.retry();
      if (!id) return;
      const subscriptions = new Subscription();
      untracked(() => {
        this.loadingState.set(true);
        this.errorState.set(false);
        this.movieState.set(undefined);
        this.relatedState.set([]);
        subscriptions.add(
          this.catalog.getMovie(id).subscribe({
            next: (movie) => {
              this.movieState.set(movie);
              this.loadingState.set(false);
              if (movie)
                subscriptions.add(
                  this.catalog.similarMovies(movie).subscribe({
                    next: (related) => this.relatedState.set(related),
                    error: () => this.relatedState.set([]),
                  }),
                );
            },
            error: (error: unknown) => {
              this.loadingState.set(false);
              this.errorState.set(!(error instanceof HttpErrorResponse && error.status === 404));
            },
          }),
        );
      });
      onCleanup(() => subscriptions.unsubscribe());
    });
    effect(() => {
      if (this.movie()) this.title.setTitle(`${this.movie()!.title} · Neo4flix`);
    });
  }

  reload(): void {
    this.retry.update((value) => value + 1);
  }
  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('');
  }
  async share(): Promise<void> {
    const film = this.movie();
    if (!film) return;
    try {
      if (navigator.share)
        await navigator.share({
          title: film.title,
          text: `À découvrir sur Neo4flix : ${film.title}`,
          url: window.location.href,
        });
      else {
        await navigator.clipboard.writeText(window.location.href);
        this.toast.show('Le lien du film est copié. Partagez-le avec vos amis.');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        this.toast.show('Vous pouvez partager le lien affiché dans la barre d’adresse.');
    }
  }
}
