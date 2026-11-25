import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { PageTransitionService } from '../../../core/services/page-transition.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { GenreProfile, genreImage } from './genre.data';

@Component({
  selector: 'nfx-genre-card',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './genre-card.component.html',
  styleUrl: './genre-card.component.css',
})
export class GenreCardComponent {
  readonly genre = input.required<GenreProfile>();
  readonly index = input(0);
  readonly featured = input(false);
  readonly spacious = computed(
    () => this.featured() || [1, 2, 5, 6, 11].includes(this.index() % 12),
  );
  readonly imageFailed = signal(false);
  readonly image = computed(() => genreImage(this.genre()));
  private readonly router = inject(Router);
  readonly transition = inject(PageTransitionService);
  private readonly toast = inject(ToastService);
  readonly href = computed(() =>
    this.router.serializeUrl(this.router.createUrlTree(['/genres', this.genre().slug])),
  );
  readonly pointerHover = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private motion?: gsap.core.Timeline;

  constructor() {
    const media = gsap.matchMedia();
    const render = afterNextRender(() => {
      media.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          this.motion = gsap
            .timeline({ paused: true })
            .to('.genre-card', { y: -4, duration: 0.3, ease: 'power2.out' }, 0)
            .to('.genre-visual', { scale: 1.06, duration: 0.5, ease: 'power2.out' }, 0)
            .to('.genre-arrow nfx-icon', { x: 2, y: -2, duration: 0.3, ease: 'power2.out' }, 0);
          return () => {
            this.motion = undefined;
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

  open(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    void this.transition
      .navigate(this.href(), {
        title: this.genre().name,
        description: this.genre().description,
        image: this.imageFailed() ? undefined : this.image(),
      })
      .catch(() => this.toast.show('Cet univers est momentanément indisponible. Réessayez.'));
  }

  @HostListener('pointerenter', ['$event'])
  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.pointerHover.set(true);
    this.motion?.play();
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    this.pointerHover.set(false);
    if (!this.host.matches(':focus-within')) this.motion?.reverse();
  }

  @HostListener('focusin')
  onFocus(): void {
    this.motion?.play();
  }

  @HostListener('focusout', ['$event'])
  onBlur(event: FocusEvent): void {
    if (
      !this.pointerHover() &&
      (!event.relatedTarget || !this.host.contains(event.relatedTarget as Node))
    )
      this.motion?.reverse();
  }
}
