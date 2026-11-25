import { gsap } from 'gsap';

export type SlideDirection = -1 | 1;

export interface HeroSlideElements {
  scene: HTMLElement;
  image: HTMLElement | null;
  copy: HTMLElement;
  copyParts: HTMLElement[];
  progress: HTMLElement;
}

export interface HeroSliderElements {
  root: HTMLElement;
  slides: HeroSlideElements[];
  counter: HTMLElement;
  counterViewport: HTMLElement;
}

export interface SlideTransition {
  from: number;
  to: number;
  direction: SlideDirection;
  onComplete: () => void;
}

export class HeroSliderMotion {
  private readonly media = gsap.matchMedia();
  private readonly resize: ResizeObserver;
  private context?: gsap.Context;
  private timeline?: gsap.core.Timeline;
  private onComplete?: () => void;
  private counterHeight: number;
  private motionEnabled = false;
  private desktop = false;
  private destroyed = false;

  constructor(private readonly elements: HeroSliderElements) {
    this.counterHeight = elements.counterViewport.getBoundingClientRect().height;
    this.media.add(
      {
        desktop: '(min-width: 701px)',
        motion: '(prefers-reduced-motion: no-preference)',
      },
      (context) => {
        this.motionEnabled = Boolean(context.conditions?.['motion']);
        this.desktop = Boolean(context.conditions?.['desktop']);
        return () => {
          this.finish();
          this.motionEnabled = false;
        };
      },
      elements.root,
    );
    this.resize = new ResizeObserver(() => this.updateCounterHeight());
    this.resize.observe(elements.counterViewport);
  }

  animate(transition: SlideTransition): void {
    this.finish();
    if (this.destroyed || !this.motionEnabled) {
      transition.onComplete();
      return;
    }
    this.onComplete = transition.onComplete;
    // Each navigation owns its context. It is created outside matchMedia's setup.
    this.context = gsap.context(() => this.buildTransition(transition), this.elements.root);
  }

  finish(): void {
    if (this.destroyed || !this.timeline) return;
    this.timeline.progress(1, true);
    this.completeTransition();
  }

  destroy(): void {
    this.destroyed = true;
    this.onComplete = undefined;
    this.timeline?.kill();
    this.timeline = undefined;
    this.context?.revert();
    this.context = undefined;
    this.resize.disconnect();
    this.media.revert();
  }

  private buildTransition(transition: SlideTransition): void {
    const outgoing = this.elements.slides[transition.from];
    const incoming = this.elements.slides[transition.to];
    const duration = this.desktop ? 1.12 : 0.88;
    this.prepareLayers(outgoing, incoming, transition.direction);
    this.timeline = gsap.timeline({ onComplete: () => this.completeTransition() });
    this.animateBackdrop(incoming, outgoing, transition.direction, duration);
    this.animateCopy(incoming, outgoing, transition.direction, duration);
    this.animateCounter(transition, duration);
    this.timeline.fromTo(
      incoming.progress,
      { scaleX: 0 },
      { scaleX: 1, duration, ease: 'power3.inOut' },
      0,
    );
  }

  private prepareLayers(
    outgoing: HeroSlideElements,
    incoming: HeroSlideElements,
    direction: SlideDirection,
  ): void {
    gsap.set(outgoing.scene, { visibility: 'visible', zIndex: 1 });
    gsap.set(incoming.scene, {
      visibility: 'visible',
      zIndex: 2,
      clipPath: direction === 1 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)',
      willChange: 'clip-path',
    });
    gsap.set([outgoing.copy, incoming.copy], { visibility: 'visible' });
    gsap.set(incoming.copyParts, { yPercent: 115 * direction, autoAlpha: 0 });
    gsap.set([...outgoing.copyParts, ...incoming.copyParts], { willChange: 'transform,opacity' });
  }

  private animateBackdrop(
    incoming: HeroSlideElements,
    outgoing: HeroSlideElements,
    direction: SlideDirection,
    duration: number,
  ): void {
    this.timeline!.to(
      incoming.scene,
      { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'power3.inOut' },
      0,
    );
    if (outgoing.image) {
      this.timeline!.to(
        outgoing.image,
        { xPercent: -4 * direction, scale: 1.025, duration, ease: 'power2.inOut' },
        0,
      );
    }
    if (incoming.image) {
      this.timeline!.fromTo(
        incoming.image,
        { xPercent: 6 * direction, scale: 1.09 },
        { xPercent: 0, scale: 1, duration: duration + 0.12, ease: 'power3.out' },
        0,
      );
    }
  }

  private animateCopy(
    incoming: HeroSlideElements,
    outgoing: HeroSlideElements,
    direction: SlideDirection,
    duration: number,
  ): void {
    this.timeline!.to(
      outgoing.copyParts,
      {
        yPercent: -115 * direction,
        autoAlpha: 0,
        duration: 0.28,
        stagger: 0.035,
        ease: 'power2.in',
      },
      0,
    );
    this.timeline!.to(
      incoming.copyParts,
      { yPercent: 0, autoAlpha: 1, duration: duration * 0.53, stagger: 0.045, ease: 'power3.out' },
      duration * 0.33,
    );
  }

  private animateCounter(transition: SlideTransition, duration: number): void {
    const position = this.counterPosition(transition);
    gsap.set(this.elements.counter, { y: -(transition.from + 1) * this.counterHeight });
    this.timeline!.to(
      this.elements.counter,
      { y: -position * this.counterHeight, duration: duration * 0.75, ease: 'power3.inOut' },
      duration * 0.12,
    );
  }

  private counterPosition(transition: SlideTransition): number {
    const last = this.elements.slides.length - 1;
    if (transition.direction === 1 && transition.from === last && transition.to === 0)
      return last + 2;
    if (transition.direction === -1 && transition.from === 0 && transition.to === last) return 0;
    return transition.to + 1;
  }

  private completeTransition(): void {
    const context = this.context;
    const callback = this.onComplete;
    this.context = undefined;
    this.timeline = undefined;
    this.onComplete = undefined;
    context?.revert();
    callback?.();
  }

  private updateCounterHeight(): void {
    const height = this.elements.counterViewport.getBoundingClientRect().height;
    if (Math.abs(height - this.counterHeight) < 0.5) return;
    this.finish();
    this.counterHeight = height;
  }
}
