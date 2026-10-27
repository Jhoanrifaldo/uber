import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';
import { Conductor, EstadoViaje, OpcionServicio, Punto, TipoServicio, Viaje } from '../models/models';
import { ConfigService } from './config.service';
import { ENDPOINTS } from './endpoints';

const MOCK_KEY = 'rutaya_viajes_demo';

export const SERVICIOS: OpcionServicio[] = [
  { tipo: 'moto', nombre: 'Moto', descripcion: 'Rápido y económico', icono: '🏍️', pasajeros: 1, base: 3000, porKm: 900 },
  { tipo: 'economico', nombre: 'Económico', descripcion: 'Viajes del día a día', icono: '🚗', pasajeros: 4, base: 4500, porKm: 1400 },
  { tipo: 'confort', nombre: 'Confort', descripcion: 'Carros nuevos y amplios', icono: '🚙', pasajeros: 4, base: 6500, porKm: 1900 },
  { tipo: 'xl', nombre: 'XL', descripcion: 'Hasta 6 personas', icono: '🚐', pasajeros: 6, base: 8000, porKm: 2400 },
];

const CONDUCTORES: Conductor[] = [
  { nombre: 'Carlos Ramírez', placa: 'KLM 482', vehiculo: 'Chevrolet Onix · Gris', calificacion: 4.9, telefono: '3001234567' },
  { nombre: 'Andrea Torres', placa: 'HTR 915', vehiculo: 'Renault Logan · Blanco', calificacion: 4.8, telefono: '3109876543' },
  { nombre: 'Julián Pérez', placa: 'FXS 27F', vehiculo: 'Yamaha NMAX · Negra', calificacion: 4.7, telefono: '3204567890' },
];

@Injectable({ providedIn: 'root' })
export class ViajeService {
  private http = inject(HttpClient);
  private cfg = inject(ConfigService);

  precio(tipo: TipoServicio, km: number): number {
    const s = SERVICIOS.find((x) => x.tipo === tipo)!;
    return Math.round((s.base + s.porKm * km) / 100) * 100; // redondeo a $100
  }

  solicitar(origen: Punto, destino: Punto, tipo: TipoServicio, km: number): Observable<Viaje> {
    const body = {
      origen: origen.nombre, destino: destino.nombre,
      origen_lat: origen.lat, origen_lng: origen.lng,
      destino_lat: destino.lat, destino_lng: destino.lng,
      tipo, distancia_km: +km.toFixed(2), precio: this.precio(tipo, km),
    };
    if (this.cfg.useMock()) {
      const lista = this.mockLeer();
      const v: Viaje = { ...body, id: Date.now(), estado: 'buscando', conductor: null, created_at: new Date().toISOString() };
      this.mockGuardar([v, ...lista]);
      return of(v).pipe(delay(500));
    }
    return this.http.post<any>(this.cfg.url(ENDPOINTS.viajes), body).pipe(map((r) => this.normalizar(r)));
  }

  listar(): Observable<Viaje[]> {
    if (this.cfg.useMock()) return of(this.mockLeer()).pipe(delay(300));
    return this.http.get<any>(this.cfg.url(ENDPOINTS.viajes)).pipe(
      map((r) => (Array.isArray(r) ? r : r.data ?? r.viajes ?? []).map((v: any) => this.normalizar(v))),
    );
  }

  obtener(id: number): Observable<Viaje> {
    if (this.cfg.useMock()) {
      const v = this.mockLeer().find((x) => x.id === id);
      return v ? of(v) : throwError(() => new Error('Viaje no encontrado'));
    }
    return this.http.get<any>(this.cfg.url(ENDPOINTS.viaje(id))).pipe(map((r) => this.normalizar(r)));
  }

  cancelar(id: number): Observable<unknown> {
    if (this.cfg.useMock()) return of(this.mockActualizar(id, { estado: 'cancelado' }));
    return this.http.put(this.cfg.url(ENDPOINTS.cancelar(id)), {});
  }

  calificar(id: number, calificacion: number): Observable<unknown> {
    if (this.cfg.useMock()) return of(this.mockActualizar(id, { calificacion }));
    return this.http.put(this.cfg.url(ENDPOINTS.calificar(id)), { calificacion });
  }

  /** Solo modo demo: avanza el estado del viaje para simular al conductor. */
  mockAvanzar(id: number, estado: EstadoViaje): Viaje | undefined {
    const extra: Partial<Viaje> = { estado };
    if (estado === 'asignado') {
      const v = this.mockLeer().find((x) => x.id === id);
      const motos = v?.tipo === 'moto';
      extra.conductor = motos ? CONDUCTORES[2] : CONDUCTORES[Math.floor(Math.random() * 2)];
    }
    return this.mockActualizar(id, extra);
  }

  /** Laravel a veces devuelve {data: {...}} o números como string. */
  private normalizar(r: any): Viaje {
    const v = r?.data ?? r?.viaje ?? r;
    return {
      ...v,
      id: +v.id,
      origen_lat: +v.origen_lat, origen_lng: +v.origen_lng,
      destino_lat: +v.destino_lat, destino_lng: +v.destino_lng,
      precio: +v.precio, distancia_km: +(v.distancia_km ?? 0),
      estado: (v.estado ?? 'buscando') as EstadoViaje,
    };
  }

  private mockLeer(): Viaje[] {
    try { return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]'); } catch { return []; }
  }
  private mockGuardar(l: Viaje[]) {
    try { localStorage.setItem(MOCK_KEY, JSON.stringify(l)); } catch {}
  }
  private mockActualizar(id: number, cambios: Partial<Viaje>): Viaje | undefined {
    const l = this.mockLeer();
    const i = l.findIndex((x) => x.id === id);
    if (i < 0) return undefined;
    l[i] = { ...l[i], ...cambios };
    this.mockGuardar(l);
    return l[i];
  }
}
