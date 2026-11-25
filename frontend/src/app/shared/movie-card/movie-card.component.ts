import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { MovieView } from '../../core/models/movie.model';
import { WatchlistService } from '../../core/services/watchlist.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'nfx-movie-card',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.css',
})
export class MovieCardComponent {
  readonly movie = input.required<MovieView>();
  readonly watchlist = inject(WatchlistService);
  private readonly imageIndex = signal(0);
  private readonly imageSources = computed(() =>
    [...new Set([this.movie().poster, this.movie().backdrop])].filter((source): source is string =>
      Boolean(source),
    ),
  );
  readonly imageUrl = computed(() => this.imageSources()[this.imageIndex()]);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private hoverMotion?: gsap.core.Timeline;
  readonly pointerHover = signal(false);

  constructor() {
    effect(() => {
      this.imageSources();
      this.imageIndex.set(0);
    });

    const media = gsap.matchMedia();
    const render = afterNextRender(() => {
      media.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          // Animate the article so the existing scroll reveal can move the host independently.
          this.hoverMotion = gsap
            .timeline({ paused: true })
            .to('.movie-card', { y: -5, duration: 0.3, ease: 'power2.out' }, 0)
            .to('.poster-image', { scale: 1.06, duration: 0.5, ease: 'power2.out' }, 0);
          this.updateHover();
          return () => {
            this.hoverMotion = undefined;
          };
        },
        this.host,
      );
    });
    inject(DestroyRef).onDestroy(() => {
      render.destroy();
      media.revert();
    });
  }

  skipImage(): void {
    this.imageIndex.update((index) => index + 1);
  }

  @HostListener('pointerenter', ['$event'])
  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.pointerHover.set(true);
    this.updateHover();
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    this.pointerHover.set(false);
    this.updateHover();
  }

  @HostListener('focusin')
  onFocus(): void {
    this.updateHover();
  }

  @HostListener('focusout', ['$event'])
  onBlur(event: FocusEvent): void {
    if (!event.relatedTarget || !this.host.contains(event.relatedTarget as Node)) {
      if (this.pointerHover()) this.hoverMotion?.play();
      else this.hoverMotion?.reverse();
    }
  }

  private updateHover(): void {
    if (this.pointerHover() || this.host.matches(':focus-within')) this.hoverMotion?.play();
    else this.hoverMotion?.reverse();
  }
}
