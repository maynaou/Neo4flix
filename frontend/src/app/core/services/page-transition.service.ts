import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';

export interface PageTransitionArtwork {
  title: string;
  description: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class PageTransitionService {
  private readonly router = inject(Router);
  readonly artwork = signal<PageTransitionArtwork | null>(null);
  readonly running = signal(false);
  private cover?: HTMLElement;
  private animation?: gsap.core.Tween;

  attach(cover: HTMLElement): void {
    this.cover = cover;
  }

  detach(): void {
    this.animation?.progress(1);
    this.cover = undefined;
  }

  async navigate(url: string, artwork: PageTransitionArtwork): Promise<boolean> {
    if (this.running() || this.router.url === url) return false;
    const cover = this.cover;
    if (!cover || this.reducedMotion()) {
      const navigated = await this.openPage(url);
      if (navigated) document.getElementById('main-content')?.focus({ preventScroll: true });
      return navigated;
    }

    this.running.set(true);
    this.artwork.set(artwork);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: reduce)', () => {
      this.animation?.progress(1);
    });
    try {
      await this.nextFrame();
      gsap.set(cover, { y: 0, yPercent: 100, autoAlpha: 1 });
      await this.move(cover, 0);
      const navigated = await this.openPage(url);
      await this.move(cover, -100);
      if (navigated) document.getElementById('main-content')?.focus({ preventScroll: true });
      return navigated;
    } finally {
      this.animation?.kill();
      media.revert();
      gsap.set(cover, { y: 0, yPercent: 100, autoAlpha: 0 });
      this.artwork.set(null);
      this.running.set(false);
    }
  }

  private async openPage(url: string): Promise<boolean> {
    const navigated = await this.router.navigateByUrl(url);
    await this.nextFrame();
    await this.nextFrame();
    if (navigated) window.scrollTo({ top: 0, behavior: 'instant' });
    return navigated;
  }

  private move(cover: HTMLElement, yPercent: number): Promise<void> {
    return new Promise((resolve) => {
      this.animation = gsap.to(cover, {
        yPercent,
        duration: this.reducedMotion() ? 0 : 0.42,
        ease: 'power3.inOut',
        onComplete: resolve,
      });
    });
  }

  private reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
}
