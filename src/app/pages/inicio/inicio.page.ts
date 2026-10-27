import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward, search, time } from 'ionicons/icons';
import { Punto, Viaje } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { GeoService } from '../../core/services/geo.service';
import { SERVICIOS, ViajeService } from '../../core/services/viaje.service';
import { MapaComponent } from '../../shared/mapa.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [IonContent, IonIcon, MapaComponent],
  template: `
  <ion-content [fullscreen]="true" [scrollY]="false">
    <app-mapa [origen]="origen()" [margenAbajo]="330"></app-mapa>

    <div class="saludo">Hola, {{ nombre() }} 👋</div>

    @if (activo(); as v) {
      <button class="activo" (click)="irA('/viaje/' + v.id)">
        <span class="dot"></span> Tienes un viaje en curso hacia {{ corto(v.destino) }}
        <ion-icon name="chevron-forward"></ion-icon>
      </button>
    }

    <div class="sheet">
      <button class="buscar" (click)="irA('/solicitar')">
        <ion-icon name="search"></ion-icon> ¿A dónde vas?
        <span class="ahora">Ahora</span>
      </button>

      @for (r of recientes(); track r.nombre) {
        <button class="reciente" (click)="ir(r)">
          <span class="ic"><ion-icon name="time"></ion-icon></span>
          <span class="txt"><b>{{ corto(r.nombre) }}</b><small>{{ r.nombre }}</small></span>
        </button>
      }

      <h3>Servicios</h3>
      <div class="servicios">
        @for (s of servicios; track s.tipo) {
          <button class="srv" (click)="irA('/solicitar')"><span>{{ s.icono }}</span>{{ s.nombre }}</button>
        }
      </div>
    </div>
  </ion-content>`,
  styles: [`
    app-mapa{position:absolute;inset:0}
    .saludo{position:absolute;z-index:500;top:calc(14px + var(--ion-safe-area-top,0px));left:16px;
      background:#fff;padding:10px 16px;border-radius:24px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,.15)}
    .activo{position:absolute;z-index:500;top:calc(64px + var(--ion-safe-area-top,0px));left:16px;right:16px;
      background:#06c167;color:#fff;border:0;border-radius:12px;padding:12px 14px;font:inherit;font-weight:600;
      display:flex;align-items:center;gap:8px;text-align:left}
    .activo ion-icon{margin-left:auto}
    .dot{width:8px;height:8px;border-radius:50%;background:#fff;flex:none;animation:p 1.2s infinite}
    @keyframes p{50%{opacity:.3}}
    .buscar{width:100%;display:flex;align-items:center;gap:12px;background:#eee;border:0;border-radius:12px;
      padding:14px 16px;font:inherit;font-size:18px;font-weight:600;color:#000}
    .ahora{margin-left:auto;background:#fff;border-radius:20px;padding:6px 12px;font-size:13px}
    .reciente{width:100%;display:flex;align-items:center;gap:14px;background:none;border:0;
      border-bottom:1px solid #f0f0f0;padding:12px 0;font:inherit;text-align:left;color:inherit}
    .ic{width:38px;height:38px;border-radius:50%;background:#eee;display:grid;place-items:center;flex:none}
    .txt{display:flex;flex-direction:column;min-width:0}
    .txt small{color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    h3{font-size:16px;font-weight:700;margin:18px 0 10px}
    .servicios{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .srv{background:#f3f3f3;border:0;border-radius:12px;padding:10px 4px;font:inherit;font-size:12px;
      font-weight:600;display:flex;flex-direction:column;align-items:center;gap:4px;color:#000}
    .srv span{font-size:26px}
  `],
})
export class InicioPage implements ViewWillEnter {
  private geo = inject(GeoService);
  private viajes = inject(ViajeService);
  private router = inject(Router);
  private auth = inject(AuthService);

  servicios = SERVICIOS;
  origen = signal<Punto | null>(null);
  historial = signal<Viaje[]>([]);
  nombre = computed(() => (this.auth.usuario()?.name ?? '').split(' ')[0]);
  activo = computed(() => this.historial().find((v) => !['finalizado', 'cancelado'].includes(v.estado)));
  recientes = computed(() => {
    const vistos = new Set<string>();
    return this.historial()
      .filter((v) => !vistos.has(v.destino) && vistos.add(v.destino))
      .slice(0, 2)
      .map((v) => ({ lat: v.destino_lat, lng: v.destino_lng, nombre: v.destino }));
  });

  async ionViewWillEnter() {
    this.viajes.listar().subscribe({ next: (l) => this.historial.set(l), error: () => {} });
    this.origen.set(await this.geo.ubicacionActual());
  }

  irA(url: string) { this.router.navigateByUrl(url); }

  ir(p: Punto) {
    this.router.navigate(['/solicitar'], { queryParams: { lat: p.lat, lng: p.lng, nombre: p.nombre } });
  }

  corto(n: string) { return n.split(',')[0]; }

  constructor() { addIcons({ search, time, chevronForward }); }
}
