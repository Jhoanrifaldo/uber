import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, map, of, tap } from 'rxjs';
import { Usuario } from '../models/models';
import { ConfigService } from './config.service';
import { ENDPOINTS } from './endpoints';

const TOKEN_KEY = 'rutaya_token';
const USER_KEY = 'rutaya_user';

interface AuthResponse {
  token?: string;
  access_token?: string;
  user?: Usuario;
  usuario?: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private cfg = inject(ConfigService);

  readonly usuario = signal<Usuario | null>(this.leer<Usuario>(USER_KEY));
  readonly token = signal<string | null>(this.leerTexto(TOKEN_KEY));
  readonly autenticado = computed(() => !!this.token());

  login(email: string, password: string): Observable<Usuario> {
    if (this.cfg.useMock()) {
      return of({ token: 'demo-token', user: { id: 1, name: email.split('@')[0] || 'Pasajero', email } })
        .pipe(delay(600), map((r) => this.guardarSesion(r)));
    }
    return this.http.post<AuthResponse>(this.cfg.url(ENDPOINTS.login), { email, password })
      .pipe(map((r) => this.guardarSesion(r)));
  }

  registrar(datos: { name: string; email: string; password: string; telefono?: string }): Observable<Usuario> {
    if (this.cfg.useMock()) {
      return of({ token: 'demo-token', user: { id: 1, ...datos } }).pipe(delay(700), map((r) => this.guardarSesion(r)));
    }
    return this.http
      .post<AuthResponse>(this.cfg.url(ENDPOINTS.register), { ...datos, password_confirmation: datos.password })
      .pipe(map((r) => this.guardarSesion(r)));
  }

  logout(): Observable<unknown> {
    const fin = () => this.limpiar();
    if (this.cfg.useMock() || !this.token()) { fin(); return of(null); }
    return this.http.post(this.cfg.url(ENDPOINTS.logout), {}).pipe(tap({ next: fin, error: fin }));
  }

  limpiar() {
    this.token.set(null);
    this.usuario.set(null);
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch {}
  }

  /** Acepta {token,user} o {access_token,usuario} (formatos típicos de Sanctum/JWT). */
  private guardarSesion(r: AuthResponse): Usuario {
    const token = r.token ?? r.access_token ?? null;
    const user = (r.user ?? r.usuario) as Usuario;
    this.token.set(token);
    this.usuario.set(user);
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
    return user;
  }

  private leerTexto(k: string): string | null {
    try { return localStorage.getItem(k); } catch { return null; }
  }
  private leer<T>(k: string): T | null {
    const v = this.leerTexto(k);
    try { return v ? (JSON.parse(v) as T) : null; } catch { return null; }
  }
}
