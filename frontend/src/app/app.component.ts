import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CatalogService } from './core/services/catalog.service';
import { AuthService } from './core/services/auth.service';
import { WatchlistService } from './core/services/watchlist.service';
import { ToastService } from './core/services/toast.service';
import { IconComponent } from './shared/icon/icon.component';
import { SidebarMotionDirective } from './shared/sidebar/sidebar-motion.directive';
import { PageTransitionComponent } from './shared/page-transition/page-transition.component';

@Component({
  selector: 'nfx-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    SidebarMotionDirective,
    PageTransitionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly catalog = inject(CatalogService);
  readonly auth = inject(AuthService);
  readonly watchlist = inject(WatchlistService);
  readonly toast = inject(ToastService);
  readonly sidebarCollapsed = signal(this.readSidebarPreference());
  private readonly router = inject(Router);
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  onSearch(event: Event): void {
    this.catalog.search.set((event.target as HTMLInputElement).value);
  }
  submitSearch(event: Event): void {
    event.preventDefault();
    void this.router.navigate(['/'], { fragment: 'catalogue' });
  }
  logout(): void {
    this.auth.logout();
    this.toast.show('Vous êtes déconnecté. À bientôt au cinéma.');
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
    try {
      localStorage.setItem('neo4flix.sidebar.collapsed', String(this.sidebarCollapsed()));
    } catch {
      // The preference remains available for the current session.
    }
  }

  private readSidebarPreference(): boolean {
    try {
      return localStorage.getItem('neo4flix.sidebar.collapsed') === 'true';
    } catch {
      return false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  focusSearch(event: KeyboardEvent): void {
    if (!event.isComposing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  }
}
