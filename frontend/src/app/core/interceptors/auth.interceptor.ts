import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (
    !request.url.startsWith('/api/') ||
    request.url.startsWith('/api/auth/') ||
    request.url.startsWith('/api/tmdb/')
  )
    return next(request);
  const auth = inject(AuthService);
  const session = auth.session();
  const outgoing = session
    ? request.clone({ setHeaders: { Authorization: `Bearer ${session.accessToken}` } })
    : request;
  return next(outgoing).pipe(
    catchError((error) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !session)
        return throwError(() => error);
      return auth
        .refresh()
        .pipe(
          switchMap((tokens) =>
            next(request.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } })),
          ),
        );
    }),
  );
};
