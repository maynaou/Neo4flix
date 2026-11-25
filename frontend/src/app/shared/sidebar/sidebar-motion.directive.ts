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

const animatedProperties = ['--sidebar-width', '--sidebar-label-opacity', '--sidebar-toggle-angle'];

@Directive({ selector: '[nfxSidebarMotion]' })
export class SidebarMotionDirective {
  readonly nfxSidebarMotion = input(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private transition?: (collapsed: boolean) => void;
  private animation?: gsap.core.Timeline;

  constructor() {
    const media = gsap.matchMedia();
    const initialRender = afterNextRender(() => {
      this.settle(this.nfxSidebarMotion());
      media.add(
        {
          desktop: '(min-width: 1024px)',
          motion: '(prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const animate = Boolean(context.conditions?.['desktop'] && context.conditions['motion']);
          this.transition = (collapsed) => {
            context.add(() => {
              if (
                this.host.classList.contains('sidebar-collapsed') === collapsed &&
                !this.animation?.isActive()
              )
                return;

              if (animate) this.animateTo(collapsed);
              else {
                this.animation?.kill();
                this.settle(collapsed);
              }
            });
          };

          return () => {
            this.transition = undefined;
            this.animation?.kill();
            this.settle(this.nfxSidebarMotion());
          };
        },
        this.host,
      );
    });

    effect((onCleanup) => {
      const collapsed = this.nfxSidebarMotion();
      const render = afterNextRender(
        () => {
          if (this.transition) this.transition(collapsed);
          else this.settle(collapsed);
        },
        { injector: this.injector },
      );
      onCleanup(() => render.destroy());
    });

    const resize = () => {
      this.animation?.kill();
      this.settle(this.nfxSidebarMotion());
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', resize, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', resize);
      initialRender.destroy();
      media.revert();
    });
  }

  private animateTo(collapsed: boolean): void {
    this.animation?.kill();
    const styles = getComputedStyle(this.host);
    const width = parseFloat(styles.getPropertyValue('--sidebar-width'));
    const labelOpacity = parseFloat(styles.getPropertyValue('--sidebar-label-opacity'));
    const angle = parseFloat(styles.getPropertyValue('--sidebar-toggle-angle'));
    const expandedWidth = parseFloat(styles.getPropertyValue('--sidebar-expanded-width'));

    // Preserve the current frame when the user reverses a transition.
    gsap.set(this.host, {
      '--sidebar-width': `${width}px`,
      '--sidebar-label-opacity': labelOpacity,
      '--sidebar-toggle-angle': `${angle}deg`,
    });
    this.host.classList.toggle('sidebar-collapsed', collapsed);
    this.host.classList.add('sidebar-animating');

    this.animation = gsap.timeline({
      defaults: { duration: 0.36, ease: 'power2.inOut', overwrite: 'auto' },
      onComplete: () => {
        this.settle(collapsed);
        ScrollTrigger.refresh();
      },
    });
    this.animation.to(
      this.host,
      {
        '--sidebar-width': `${collapsed ? 80 : expandedWidth}px`,
        '--sidebar-toggle-angle': collapsed ? '180deg' : '0deg',
      },
      0,
    );
    this.animation.to(
      this.host,
      {
        '--sidebar-label-opacity': collapsed ? 0 : 1,
        duration: collapsed ? 0.14 : 0.2,
        ease: 'power1.inOut',
      },
      collapsed ? 0 : 0.06,
    );
  }

  private settle(collapsed: boolean): void {
    this.host.classList.toggle('sidebar-collapsed', collapsed);
    this.host.classList.remove('sidebar-animating');
    animatedProperties.forEach((property) => this.host.style.removeProperty(property));
  }
}
