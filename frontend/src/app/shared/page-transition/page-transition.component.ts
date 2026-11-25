import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { PageTransitionService } from '../../core/services/page-transition.service';

@Component({
  selector: 'nfx-page-transition',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-transition.component.html',
  styleUrl: './page-transition.component.css',
})
export class PageTransitionComponent {
  readonly transition = inject(PageTransitionService);
  private readonly cover = viewChild.required<ElementRef<HTMLElement>>('cover');

  constructor() {
    const render = afterNextRender(() => this.transition.attach(this.cover().nativeElement));
    inject(DestroyRef).onDestroy(() => {
      render.destroy();
      this.transition.detach();
    });
  }
}
