import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController, IonButton, IonContent, IonIcon, IonSpinner, ViewWillEnter, ViewWillLeave,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { call, chatbubble, shieldCheckmark, star, starOutline } from 'ionicons/icons';
import { EstadoViaje, Viaje } from '../../core/models/models';
import { ConfigService } from '../../core/services/config.service';
import { GeoService } from '../../core/services/geo.service';
import { ViajeService } from '../../core/services/viaje.service';
import { MapaComponent } from '../../shared/mapa.component';

type LatLng = { lat: number; lng: number };

const TEXTOS: Record<EstadoViaje, string> = {
  buscando: 'Buscando conductor cerca de ti…',
  asignado: 'Conductor asignado',
  llegando: 'Tu conductor va en camino',
  en_curso: 'En viaje a tu destino',
  finalizado: 'Llegaste a tu destino',
  cancelado: 'Viaje cancelado',
};

@Component({
  selector: 'app-viaje-activo',
  standalone: true,
  imports: [CurrencyPipe, IonContent, IonButton, IonIcon, IonSpinner, MapaComponent],
  templateUrl: './viaje-activo.page.html',
  styleUrl: './viaje-activo.page.scss',
})
export class ViajeActivoPage implements ViewWillEnter, ViewWillLeave, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private viajes = inject(ViajeService);
  private geo = inject(GeoService);
  private cfg = inject(ConfigService);
  private alert = inject(AlertController);

  viaje = signal<Viaje | null>(null);
  auto = signal<LatLng | null>(null);
  ruta = signal<[number, number][]>([]);
  minutos = signal(0);
  estrellas = signal(0);

  estado = computed(() => this.viaje()?.estado ?? 'buscando');
  texto = computed(() => TEXTOS[this.estado()]);
  origen = computed(() => (this.viaje() ? { lat: this.viaje()!.origen_lat, lng: this.viaje()!.origen_lng } : null));
  destino = computed(() => (this.viaje() ? { lat: this.viaje()!.destino_lat, lng: this.viaje()!.destino_lng } : null));
  puedeCancelar = computed(() => ['buscando', 'asignado', 'llegando'].includes(this.estado()));
  progreso = computed(() => ({ buscando: 10, asignado: 30, llegando: 50, en_curso: 80, finalizado: 100, cancelado: 0 })[this.estado()]);

  private timers: any[] = [];
  private id = 0;

  constructor() { addIcons({ call, chatbubble, shieldCheckmark, star, starOutline }); }

  ionViewWillEnter() {
    this.id = +this.route.snapshot.paramMap.get('id')!;
    this.viajes.obtener(this.id).subscribe({
      next: (v) => {
        this.viaje.set(v);
        this.ruta.set([[v.origen_lat, v.origen_lng], [v.destino_lat, v.destino_lng]]);
        if (this.cfg.useMock()) this.simular(v);
        else this.sondear();
      },
      error: () => this.router.navigateByUrl('/tabs/inicio'),
    });
  }

  ionViewWillLeave() { this.parar(); }
  ngOnDestroy() { this.parar(); }

  // ---------- Backend real: consulta el estado cada 5 s ----------
  private sondear() {
    const t = setInterval(() => {
      this.viajes.obtener(this.id).subscribe((v) => {
        this.viaje.set(v);
        const c = v as any; // si el backend manda la posición del conductor, la mostramos
        if (c.conductor_lat && c.conductor_lng) this.auto.set({ lat: +c.conductor_lat, lng: +c.conductor_lng });
        if (['finalizado', 'cancelado'].includes(v.estado)) clearInterval(t);
      });
    }, 5000);
    this.timers.push(t);
  }

  // ---------- Modo demo: simula al conductor ----------
  private simular(v: Viaje) {
    if (['finalizado', 'cancelado'].includes(v.estado)) return;
    const o = { lat: v.origen_lat, lng: v.origen_lng, nombre: v.origen };
    const d = { lat: v.destino_lat, lng: v.destino_lng, nombre: v.destino };
    const inicio = { lat: o.lat + 0.006, lng: o.lng - 0.006, nombre: 'Conductor' };

    this.esperar(2500, () => {
      this.set(this.viajes.mockAvanzar(v.id, 'asignado'));
      this.auto.set(inicio);
      this.esperar(1500, () => {
        this.set(this.viajes.mockAvanzar(v.id, 'llegando'));
        this.geo.ruta(inicio, o).subscribe((r) => {
          this.ruta.set(r.puntos);
          this.mover(r.puntos, 8000, r.min, () => {
            this.set(this.viajes.mockAvanzar(v.id, 'en_curso'));
            this.geo.ruta(o, d).subscribe((r2) => {
              this.ruta.set(r2.puntos);
              this.mover(r2.puntos, 12000, r2.min, () => this.set(this.viajes.mockAvanzar(v.id, 'finalizado')));
            });
          });
        });
      });
    });
  }

  private mover(pts: [number, number][], ms: number, min: number, fin: () => void) {
    let i = 0;
    const paso = Math.max(1, Math.ceil(pts.length / (ms / 250)));
    const t = setInterval(() => {
      if (this.estado() === 'cancelado') return clearInterval(t);
      i = Math.min(i + paso, pts.length - 1);
      this.auto.set({ lat: pts[i][0], lng: pts[i][1] });
      this.ruta.set(pts.slice(i));
      this.minutos.set(Math.max(1, Math.round(min * (1 - i / (pts.length - 1)))));
      if (i >= pts.length - 1) { clearInterval(t); fin(); }
    }, 250);
    this.timers.push(t);
  }

  private esperar(ms: number, fn: () => void) {
    this.timers.push(setTimeout(() => { if (this.estado() !== 'cancelado') fn(); }, ms));
  }
  private set(v?: Viaje) { if (v) this.viaje.set(v); }
  private parar() { this.timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); this.timers = []; }

  // ---------- Acciones ----------
  async cancelar() {
    const a = await this.alert.create({
      header: '¿Cancelar viaje?',
      message: 'El conductor dejará de dirigirse a tu ubicación.',
      buttons: [
        { text: 'No', role: 'cancel' },
        { text: 'Sí, cancelar', role: 'destructive', handler: () => {
          this.viajes.cancelar(this.id).subscribe(() => {
            this.parar();
            this.viaje.update((v) => (v ? { ...v, estado: 'cancelado' } : v));
            this.auto.set(null);
          });
        } },
      ],
    });
    await a.present();
  }

  calificar(n: number) { this.estrellas.set(n); }

  terminar() {
    const fin = () => this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
    if (this.estrellas()) this.viajes.calificar(this.id, this.estrellas()).subscribe({ next: fin, error: fin });
    else fin();
  }

  inicial(n?: string) { return (n ?? '?').charAt(0); }
}
