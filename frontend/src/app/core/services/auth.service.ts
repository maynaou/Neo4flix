import { API_ENDPOINTS, API_REQUEST_TIMEOUT_MS } from '../api.config';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, shareReplay, tap, throwError, timeout } from 'rxjs';

import { AuthTokens, AuthSession, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<AuthSession | null>(this.readSession());
  readonly session = this.state.asReadonly();
  private refreshRequest?: Observable<AuthTokens>;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.scheduleRefresh();
  }

  login(identifier: string, password: string): Observable<void> {
    return this.http.post<AuthTokens>(API_ENDPOINTS.login, { identifier, password }).pipe(
      timeout(API_REQUEST_TIMEOUT_MS),
      tap((tokens) => this.setSession(tokens, identifier.split('@')[0])),
      map(() => undefined),
    );
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http
      .post<void>(API_ENDPOINTS.register, request)
      .pipe(timeout(API_REQUEST_TIMEOUT_MS));
  }

  refresh(): Observable<AuthTokens> {
    if (this.refreshRequest) return this.refreshRequest;
    const session = this.session();
    if (!session) return throwError(() => new Error('No active session'));
    this.refreshRequest = this.http
      .post<AuthTokens>(`${API_ENDPOINTS.refresh}/${encodeURIComponent(session.refreshToken)}`, {})
      .pipe(
        timeout(API_REQUEST_TIMEOUT_MS),
        tap((tokens) => {
          if (this.session()?.refreshToken === session.refreshToken)
            this.setSession(tokens, session.displayName);
        }),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshRequest = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshRequest;
  }

  logout(): void {
    clearTimeout(this.timer);
    this.state.set(null);
    try {
      sessionStorage.removeItem('neo4flix.session');
    } catch {
      /* Session remains in memory. */
    }
  }

  private setSession(tokens: AuthTokens, displayName: string): void {
    const payload = this.decodeToken(tokens.accessToken);
    const session = { ...tokens, subject: payload.sub, expiresAt: payload.exp * 1000, displayName };
    this.state.set(session);
    try {
      sessionStorage.setItem('neo4flix.session', JSON.stringify(session));
    } catch {
      /* Session remains in memory. */
    }
    this.scheduleRefresh();
  }

  private readSession(): AuthSession | null {
    try {
      const stored = sessionStorage.getItem('neo4flix.session');
      if (!stored) return null;
      const session = JSON.parse(stored) as AuthSession;
      if (typeof session.refreshToken !== 'string' || typeof session.displayName !== 'string')
        return null;
      const payload = this.decodeToken(session.accessToken);
      return { ...session, subject: payload.sub, expiresAt: payload.exp * 1000 };
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): { sub: string; exp: number } {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      sub: string;
      exp: number;
    };
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number')
      throw new Error('Invalid session');
    return payload;
  }

  private scheduleRefresh(): void {
    clearTimeout(this.timer);
    const session = this.session();
    if (session)
      this.timer = setTimeout(
        () => this.refresh().subscribe({ error: () => undefined }),
        Math.max(0, session.expiresAt - Date.now() - 15000),
      );
  }
}
