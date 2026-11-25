import {
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionConditions = {
  desktop: '(min-width: 1024px)',
  motion: '(prefers-reduced-motion: no-preference)',
};

@Directive({ selector: '[nfxPageMotion]' })
export class PageMotionDirective {
  readonly nfxPageKey = input<unknown>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  constructor() {
    effect((onCleanup) => {
      this.nfxPageKey();
      const media = gsap.matchMedia();
      const render = afterNextRender(
        () => {
          media.add(
            motionConditions,
            (context) => {
              if (!context.conditions?.['motion']) return;

              const entrance = gsap.fromTo(
                this.host,
                { autoAlpha: 0.65 },
                {
                  autoAlpha: 1,
                  duration: 0.4,
                  ease: 'power2.out',
                  clearProps: 'opacity,visibility',
                },
              );
              const finish = () => {
                entrance.progress(1).pause();
              };
              let refreshFrame = 0;
              const refresh = () => {
                if (refreshFrame || this.host.closest('.sidebar-animating')) return;
                refreshFrame = requestAnimationFrame(() => {
                  refreshFrame = 0;
                  if (this.host.closest('.sidebar-animating')) return;
                  ScrollTrigger.refresh();
                });
              };

              // Refresh scroll positions after API results, filters or images change the layout.
              const mutations = new MutationObserver(refresh);
              const resize = new ResizeObserver(refresh);
              mutations.observe(this.host, { childList: true, subtree: true });
              resize.observe(this.host);
              this.host.addEventListener('focusin', finish);
              this.host.addEventListener('pointerdown', finish);
              refresh();

              return () => {
                mutations.disconnect();
                resize.disconnect();
                cancelAnimationFrame(refreshFrame);
                this.host.removeEventListener('focusin', finish);
                this.host.removeEventListener('pointerdown', finish);
              };
            },
            this.host,
          );
        },
        { injector: this.injector },
      );

      onCleanup(() => {
        render.destroy();
        media.revert();
      });
    });
  }
}

@Directive({ selector: '[nfxReveal]' })
export class ScrollRevealDirective {
  readonly nfxRevealIndex = input(0);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const media = gsap.matchMedia();
    const render = afterNextRender(() => {
      media.add(
        motionConditions,
        (context) => {
          if (!context.conditions?.['motion']) return;
          const desktop = context.conditions['desktop'];
          const parent = this.host.parentElement;
          const columns =
            parent?.classList.contains('movie-grid') || parent?.classList.contains('genre-grid')
              ? Math.max(1, getComputedStyle(parent).gridTemplateColumns.split(' ').length)
              : 1;
          let revealed = false;

          // A paused tween leaves offscreen content visible and keyboard-accessible.
          const entrance = gsap.fromTo(
            this.host,
            { autoAlpha: 0, y: desktop ? 24 : 14 },
            {
              autoAlpha: 1,
              y: 0,
              duration: desktop ? 0.65 : 0.5,
              delay: Math.min((this.nfxRevealIndex() % columns) * 0.055, 0.22),
              ease: 'power3.out',
              paused: true,
              immediateRender: false,
              clearProps: 'transform,opacity,visibility',
            },
          );
          const finish = () => {
            revealed = true;
            entrance.progress(1).pause();
          };

          ScrollTrigger.create({
            trigger: this.host,
            start: 'top 93%',
            once: true,
            onEnter: () => {
              if (revealed) return;
              if (this.host.contains(document.activeElement)) finish();
              else {
                revealed = true;
                entrance.play();
              }
            },
          });
          this.host.addEventListener('focusin', finish);
          this.host.addEventListener('pointerdown', finish);

          return () => {
            this.host.removeEventListener('focusin', finish);
            this.host.removeEventListener('pointerdown', finish);
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
}

@Directive({ selector: '[nfxHeroMotion]' })
export class HeroMotionDirective {
  readonly nfxHeroMotion = input<unknown>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  constructor() {
    effect((onCleanup) => {
      this.nfxHeroMotion();
      const media = gsap.matchMedia();
      const render = afterNextRender(
        () => {
          media.add(
            motionConditions,
            (context) => {
              if (!context.conditions?.['motion']) return;
              const image = this.host.querySelector<HTMLImageElement>('.hero-image');
              const content = this.host.querySelector<HTMLElement>('.hero-content');
              const entrance = content
                ? gsap.fromTo(
                    content,
                    { autoAlpha: 0.6, y: 12 },
                    {
                      autoAlpha: 1,
                      y: 0,
                      duration: 0.6,
                      ease: 'power3.out',
                      clearProps: 'transform,opacity,visibility',
                    },
                  )
                : undefined;
              const imageFade = image
                ? gsap.fromTo(
                    image,
                    { autoAlpha: 0.35 },
                    {
                      autoAlpha: 1,
                      duration: 0.7,
                      ease: 'power2.out',
                      paused: true,
                      immediateRender: false,
                      clearProps: 'opacity,visibility',
                    },
                  )
                : undefined;
              const revealImage = () => {
                imageFade?.play();
              };

              if (image) {
                if (image.complete) revealImage();
                else image.addEventListener('load', revealImage, { once: true });

                if (context.conditions['desktop']) {
                  gsap.fromTo(
                    image,
                    { yPercent: -4, scale: 1.1 },
                    {
                      yPercent: 4,
                      scale: 1.1,
                      ease: 'none',
                      scrollTrigger: {
                        trigger: this.host,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 0.8,
                        invalidateOnRefresh: true,
                      },
                    },
                  );
                }
              }

              const finish = () => {
                entrance?.progress(1).pause();
                imageFade?.progress(1).pause();
              };
              this.host.addEventListener('focusin', finish);
              this.host.addEventListener('pointerdown', finish);
              return () => {
                image?.removeEventListener('load', revealImage);
                this.host.removeEventListener('focusin', finish);
                this.host.removeEventListener('pointerdown', finish);
              };
            },
            this.host,
          );
        },
        { injector: this.injector },
      );

      onCleanup(() => {
        render.destroy();
        media.revert();
      });
    });
  }
}
