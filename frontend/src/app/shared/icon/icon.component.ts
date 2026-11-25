import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const paths: Record<string, string[]> = {
  search: ['M21 21l-4.4-4.4', 'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
  compass: [
    'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    'm16.2 7.8-2.8 5.6-5.6 2.8 2.8-5.6 5.6-2.8Z',
  ],
  bookmark: ['M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z'],
  grid: ['M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z'],
  arrow: ['M4 12h16', 'm14 6 6 6-6 6'],
  left: ['M20 12H4', 'm10 6-6 6 6 6'],
  upRight: ['M7 17 17 7', 'M7 7h10v10'],
  plus: ['M12 5v14', 'M5 12h14'],
  check: ['m5 12 4 4L19 6'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M20 21v-2a7 7 0 0 0-14 0v2'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  eyeOff: [
    'M3 3l18 18',
    'M9.8 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.4 4.3',
    'M6.5 6.5A18 18 0 0 0 2 12s3.5 7 10 7a13 13 0 0 0 5.5-1.5',
  ],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  chevron: ['m6 9 6 6 6-6'],
  copy: ['M9 9h12v12H9Z', 'M5 15H3V3h12v2'],
  clock: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'M12 6v6l4 2'],
  film: ['M4 3h16v18H4Z', 'M4 7h16M4 17h16M8 3v18M16 3v18'],
  spark: ['m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z'],
  menu: ['M4 6h16M4 12h16M4 18h16'],
  panelClose: ['M3 3h18v18H3Z', 'M8 3v18', 'm16 9-3 3 3 3'],
  panelOpen: ['M3 3h18v18H3Z', 'M8 3v18', 'm13 9 3 3-3 3'],
};

@Component({
  selector: 'nfx-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">@for (path of iconPaths(); track $index) {<path [attr.d]="path" />}</svg>',
  styles: [
    ':host{display:inline-flex;align-items:center;justify-content:center;width:1.25rem;height:1.25rem;flex-shrink:0}svg{width:100%;height:100%}',
  ],
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly iconPaths = computed(() => paths[this.name()] ?? paths['film']);
}
