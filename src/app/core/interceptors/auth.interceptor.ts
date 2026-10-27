import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';

/** Agrega "Authorization: Bearer <token>" solo a las peticiones hacia el backend. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const cfg = inject(ConfigService);
  const router = inject(Router);

  if (!req.url.startsWith(cfg.apiUrl())) return next(req);

  const token = auth.token();
  const r = req.clone({
    setHeaders: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return next(r).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401) {
        auth.limpiar();
        router.navigateByUrl('/login');
      }
      return throwError(() => e);
    }),
  );
};
