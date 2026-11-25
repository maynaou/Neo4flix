import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { MovieView } from '../../../core/models/movie.model';
import { WatchlistService } from '../../../core/services/watchlist.service';
import { IconComponent } from '../../../shared/icon/icon.component';

const fullCover = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
const autoAdvanceDelayMs = 6_000;
const descriptions: Record<string, string> = {
  'demo-interstellar':
    'Au-delà des étoiles, un voyage où l’amour défie le temps. Une odyssée qui ne vous quittera pas.',
  'demo-inception':
    'Un rêve dans un rêve. Une idée qui peut tout changer. Entrez dans un labyrinthe où chaque détail compte.',
  'demo-the-matrix':
    'Et si votre monde n’était qu’une illusion ? Découvrez une réalité que vous ne verrez plus jamais de la même façon.',
};

@Component({
  selector: 'nfx-hero-slider',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-slider.component.html',
  styleUrl: './hero-slider.component.css',
})
export class HeroSliderComponent {
  readonly movies = input.required<readonly MovieView[]>();
  readonly fullscreen = input(false);
  readonly watchlist = inject(WatchlistService);
  readonly activeIndex = signal(0);
  readonly busy = signal(false);
  readonly announcement = signal('');
  readonly activeMovie = computed(() => this.movies()[this.activeIndex()]);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly slideElements = viewChildren<ElementRef<HTMLElement>>('slide');
  private media?: gsap.MatchMedia;
  private context?: gsap.Context;
  private animation?: gsap.core.Timeline;
  private motionEnabled = false;
  private lastMovieId?: string;
  private pendingIndex: number | null = null;
  private pendingDirection = 1;
  private pointer?: { id: number; x: number; y: number; time: number };
  private viewportResize?: ResizeObserver;

  constructor() {
    effect((onCleanup) => {
      const count = this.movies().length;
      this.activeIndex();
      if (count < 2 || this.busy()) return;

      let timer: ReturnType<typeof setTimeout>;
      const advance = () => {
        if (
          document.hidden ||
          !this.motionEnabled ||
          this.pointer ||
          this.host.contains(document.activeElement)
        ) {
          timer = setTimeout(advance, autoAdvanceDelayMs);
          return;
        }
        this.changeBy(1);
      };
      timer = setTimeout(advance, autoAdvanceDelayMs);
      onCleanup(() => clearTimeout(timer));
    });

    effect((onCleanup) => {
      this.movies();
      this.slideElements();
      const render = afterNextRender(() => this.initialize(), { injector: this.injector });
      onCleanup(() => {
        render.destroy();
        untracked(() => {
          this.animation?.kill();
          this.media?.revert();
          this.context = undefined;
        });
      });
    });

    const viewportRender = afterNextRender(() => this.observeViewportInsets());
    inject(DestroyRef).onDestroy(() => {
      viewportRender.destroy();
      this.viewportResize?.disconnect();
    });
  }

  private observeViewportInsets(): void {
    const header = this.host.closest('.app-content')?.querySelector<HTMLElement>('.topbar');
    const navigation = this.host.closest('nfx-root')?.querySelector<HTMLElement>('.mobile-nav');
    const update = () => {
      this.host.style.setProperty('--hero-header-height', `${header?.offsetHeight ?? 0}px`);
      this.host.style.setProperty('--hero-navigation-height', `${navigation?.offsetHeight ?? 0}px`);
    };
    this.viewportResize = new ResizeObserver(update);
    if (header) this.viewportResize.observe(header);
    if (navigation) this.viewportResize.observe(navigation);
    update();
  }

  words(title: string): string[] {
    return title.split(/\s+/);
  }
  description(movie: MovieView): string {
    return (
      descriptions[movie.id] ??
      movie.description ??
      'Une histoire à découvrir. Faites place à votre prochaine soirée cinéma.'
    );
  }
  cover(movie: MovieView): string | undefined {
    return movie.backdrop ?? movie.poster;
  }

  changeBy(direction: number): void {
    const count = this.movies().length;
    if (count < 2) return;
    const start = this.pendingIndex ?? this.activeIndex();
    this.goTo((start + direction + count) % count, direction);
  }

  goTo(index: number, direction = index > this.activeIndex() ? 1 : -1): void {
    if (!this.movies()[index]) return;
    if (this.busy()) {
      this.pendingIndex = index;
      this.pendingDirection = direction;
      return;
    }
    if (index === this.activeIndex()) return;
    if (!this.motionEnabled || !this.context) {
      this.activeIndex.set(index);
      this.settle();
      return;
    }
    this.context.add(() => this.transitionTo(index, direction));
  }

  private initialize(): void {
    this.animation?.kill();
    this.media?.revert();
    this.motionEnabled = false;
    this.pendingIndex = null;
    const rememberedIndex = this.movies().findIndex((movie) => movie.id === this.lastMovieId);
    this.activeIndex.set(rememberedIndex >= 0 ? rememberedIndex : 0);
    this.settle();
    this.media = gsap.matchMedia();
    this.media.add(
      { desktop: '(min-width: 701px)', motion: '(prefers-reduced-motion: no-preference)' },
      (context) => {
        this.context = context;
        this.motionEnabled = Boolean(context.conditions?.['motion']);
        const active = this.panels()[this.activeIndex()];
        if (active && this.motionEnabled) {
          this.animation = gsap.timeline();
          this.animation.fromTo(
            active.querySelectorAll('.wipe-word-inner'),
            { yPercent: 110 },
            {
              yPercent: 0,
              duration: 0.8,
              stagger: 0.055,
              ease: 'power4.out',
              clearProps: 'transform',
            },
            0,
          );
          this.animation.fromTo(
            active.querySelector('.wipe-caption'),
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              ease: 'power3.out',
              clearProps: 'transform,opacity,visibility',
            },
            0.16,
          );
        }
        return () => {
          this.animation?.kill();
          this.context = undefined;
          this.motionEnabled = false;
          this.pendingIndex = null;
          this.settle();
        };
      },
      this.host,
    );
  }

  private transitionTo(index: number, direction: number): void {
    const panels = this.panels();
    const outgoing = panels[this.activeIndex()];
    const incoming = panels[index];
    if (!outgoing || !incoming) return;
    this.animation?.kill();
    this.busy.set(true);
    this.activeIndex.set(index);
    const media = incoming.querySelector('.wipe-media');
    const enteringCover = incoming.querySelector('.wipe-cover');
    const leavingCover = outgoing.querySelector('.wipe-cover');
    const closedCover =
      direction > 0
        ? 'polygon(100% 0%, 100% 0%, 100% 100%, 110% 100%)'
        : 'polygon(0% 0%, 0% 0%, -10% 100%, 0% 100%)';

    gsap.set(outgoing, { autoAlpha: 1, zIndex: 1 });
    gsap.set(incoming, { autoAlpha: 1, zIndex: 2 });
    gsap.set(media, { clipPath: closedCover });
    gsap.set(incoming.querySelectorAll('.wipe-word-inner'), { yPercent: 115 });
    gsap.set(incoming.querySelector('.wipe-caption'), { autoAlpha: 0, y: 24 });

    this.animation = gsap.timeline({ onComplete: () => this.finishTransition() });
    this.animation.to(media, { clipPath: fullCover, duration: 0.95, ease: 'power3.inOut' }, 0);
    if (enteringCover)
      this.animation.fromTo(
        enteringCover,
        { xPercent: direction * 5, scale: 1.08 },
        {
          xPercent: 0,
          scale: 1,
          duration: 1.05,
          ease: 'power3.out',
          immediateRender: false,
        },
        0,
      );
    if (leavingCover)
      this.animation.to(
        leavingCover,
        { xPercent: direction * -2, scale: 1.02, duration: 0.95, ease: 'power2.inOut' },
        0,
      );
    this.animation.to(
      outgoing.querySelectorAll('.wipe-word-inner'),
      { yPercent: -110, duration: 0.3, stagger: 0.025, ease: 'power2.in' },
      0,
    );
    this.animation.to(
      outgoing.querySelector('.wipe-caption'),
      { autoAlpha: 0, y: -14, duration: 0.22, ease: 'power2.in' },
      0,
    );
    this.animation.to(
      incoming.querySelectorAll('.wipe-word-inner'),
      { yPercent: 0, duration: 0.7, stagger: 0.045, ease: 'power4.out' },
      0.2,
    );
    this.animation.to(
      incoming.querySelector('.wipe-caption'),
      { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      0.34,
    );
  }

  private finishTransition(): void {
    const next = this.pendingIndex;
    const direction = this.pendingDirection;
    this.pendingIndex = null;
    this.settle();
    if (next !== null && next !== this.activeIndex()) this.goTo(next, direction);
  }

  private settle(): void {
    this.panels().forEach((panel, index) => {
      gsap.set(panel, {
        autoAlpha: index === this.activeIndex() ? 1 : 0,
        zIndex: index === this.activeIndex() ? 2 : 0,
      });
      gsap.set(
        panel.querySelectorAll('.wipe-media, .wipe-cover, .wipe-word-inner, .wipe-caption'),
        {
          clearProps: 'transform,opacity,visibility,clipPath',
        },
      );
    });
    this.busy.set(false);
    const movie = this.activeMovie();
    this.lastMovieId = movie?.id;
    this.announcement.set(
      movie ? `${movie.title}, film ${this.activeIndex() + 1} sur ${this.movies().length}.` : '',
    );
  }

  private panels(): HTMLElement[] {
    return this.slideElements().map((element) => element.nativeElement);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      this.changeBy(event.key === 'ArrowRight' ? 1 : -1);
    }
  }

  @HostListener('focusin', ['$event'])
  onFocus(event: FocusEvent): void {
    if (this.motionEnabled && (event.target as HTMLElement).closest('.wipe-caption')) {
      this.pendingIndex = null;
      this.animation?.progress(1);
    }
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (
      event.button !== 0 ||
      target.closest('a, button') ||
      (event.pointerType === 'mouse' && target.closest('.wipe-copy'))
    )
      return;
    this.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
    this.host.setPointerCapture(event.pointerId);
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    const start = this.pointer;
    this.pointer = undefined;
    if (!start || start.id !== event.pointerId) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (
      Math.abs(x) > 50 &&
      Math.abs(x) > Math.abs(y) * 1.3 &&
      performance.now() - start.time < 1500
    )
      this.changeBy(x < 0 ? 1 : -1);
  }

  @HostListener('pointercancel')
  onPointerCancel(): void {
    this.pointer = undefined;
  }
}
