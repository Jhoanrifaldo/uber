import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Punto } from '../models/models';

/** Ubicación, búsqueda de direcciones (OpenStreetMap) y rutas (OSRM). Sin API key. */
@Injectable({ providedIn: 'root' })
export class GeoService {
  private http = inject(HttpClient);

  /** Si el navegador no da ubicación se usa este punto. */
  readonly porDefecto: Punto = { lat: 4.6097, lng: -74.0817, nombre: 'Mi ubicación' };

  ubicacionActual(): Promise<Punto> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(this.porDefecto);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, nombre: 'Mi ubicación' }),
        () => resolve(this.porDefecto),
        { enableHighAccuracy: true, timeout: 7000 },
      );
    });
  }

  buscar(texto: string, cerca?: Punto): Observable<Punto[]> {
    if (texto.trim().length < 3) return of([]);
    let url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=co&q=${encodeURIComponent(texto)}`;
    if (cerca) {
      const d = 0.4;
      url += `&viewbox=${cerca.lng - d},${cerca.lat + d},${cerca.lng + d},${cerca.lat - d}`;
    }
    return this.http.get<any[]>(url).pipe(
      map((r) => r.map((x) => ({ lat: +x.lat, lng: +x.lon, nombre: this.corto(x.display_name) }))),
      catchError(() => of([])),
    );
  }

  nombreDe(p: { lat: number; lng: number }): Observable<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.lat}&lon=${p.lng}&zoom=17`;
    return this.http.get<any>(url).pipe(
      map((r) => this.corto(r?.display_name ?? 'Punto en el mapa')),
      catchError(() => of('Punto en el mapa')),
    );
  }

  /** Ruta por calles. Si falla, devuelve línea recta. */
  ruta(a: Punto, b: Punto): Observable<{ puntos: [number, number][]; km: number; min: number }> {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    return this.http.get<any>(url).pipe(
      map((r) => {
        const route = r.routes[0];
        return {
          puntos: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]),
          km: route.distance / 1000,
          min: route.duration / 60,
        };
      }),
      catchError(() => {
        const km = this.distanciaKm(a, b) * 1.3;
        return of({ puntos: [[a.lat, a.lng], [b.lat, b.lng]] as [number, number][], km, min: (km / 25) * 60 });
      }),
    );
  }

  distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  private corto(nombre: string) {
    return nombre.split(',').slice(0, 3).join(',').trim();
  }
}
