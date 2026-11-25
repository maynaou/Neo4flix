import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { MovieView } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly idsState = signal<string[]>([]);
  readonly ids = this.idsState.asReadonly();

  constructor() {
    effect(() => {
      const key = this.storageKey();
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
        this.idsState.set(
          Array.isArray(stored)
            ? [...new Set(stored.filter((id): id is string => typeof id === 'string'))]
            : [],
        );
      } catch {
        this.idsState.set([]);
      }
    });
  }

  has(id: string): boolean {
    return this.ids().includes(id);
  }

  toggle(movie: MovieView): void {
    const existed = this.has(movie.id);
    const ids = existed ? this.ids().filter((id) => id !== movie.id) : [...this.ids(), movie.id];
    this.idsState.set(ids);
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(ids));
      this.toast.show(`${movie.title} ${existed ? 'retiré de' : 'ajouté à'} votre liste.`);
    } catch {
      this.toast.show(
        'Liste mise à jour pour cette session. Le stockage de cet appareil est indisponible.',
      );
    }
  }

  private storageKey(): string {
    return `neo4flix.watchlist.${this.auth.session()?.subject ?? 'guest'}`;
  }
}
