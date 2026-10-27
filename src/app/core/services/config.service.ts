import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

const KEY = 'rutaya_config';

/** Guarda la URL del backend y el modo demo para cambiarlos sin recompilar. */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  readonly apiUrl = signal<string>(environment.apiUrl);
  readonly useMock = signal<boolean>(environment.useMock);

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (typeof c.apiUrl === 'string') this.apiUrl.set(c.apiUrl);
        if (typeof c.useMock === 'boolean') this.useMock.set(c.useMock);
      }
    } catch { /* sin storage: usa los valores por defecto */ }
  }

  guardar(apiUrl: string, useMock: boolean) {
    this.apiUrl.set(apiUrl.replace(/\/+$/, ''));
    this.useMock.set(useMock);
    try { localStorage.setItem(KEY, JSON.stringify({ apiUrl: this.apiUrl(), useMock })); } catch {}
  }

  url(path: string) {
    return `${this.apiUrl()}${path}`;
  }
}
