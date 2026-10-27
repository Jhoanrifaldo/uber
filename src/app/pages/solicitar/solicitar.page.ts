import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner, ToastController, ViewWillEnter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, cash, close, location, person } from 'ionicons/icons';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Punto, TipoServicio } from '../../core/models/models';
import { mensajeError } from '../../core/services/errores';
import { GeoService } from '../../core/services/geo.service';
import { SERVICIOS, ViajeService } from '../../core/services/viaje.service';
import { MapaComponent } from '../../shared/mapa.component';

@Component({
  selector: 'app-solicitar',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DecimalPipe, IonButton, IonContent, IonIcon, IonSpinner, MapaComponent],
  templateUrl: './solicitar.page.html',
  styleUrl: './solicitar.page.scss',
})
export class SolicitarPage implements ViewWillEnter {
  private geo = inject(GeoService);
  private viajes = inject(ViajeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastController);

  servicios = SERVICIOS;
  origen = signal<Punto | null>(null);
  destino = signal<Punto | null>(null);
  ruta = signal<[number, number][]>([]);
  km = signal(0);
  min = signal(0);
  tipo = signal<TipoServicio>('economico');
  texto = '';
  resultados = signal<Punto[]>([]);
  buscando = signal(false);
  calculando = signal(false);
  enviando = signal(false);

  private busqueda$ = new Subject<string>();

  constructor() {
    addIcons({ arrowBack, close, location, person, cash });
    this.busqueda$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((t) => { this.buscando.set(true); return this.geo.buscar(t, this.origen() ?? undefined); }),
    ).subscribe((r) => { this.resultados.set(r); this.buscando.set(false); });
  }

  async ionViewWillEnter() {
    this.origen.set(await this.geo.ubicacionActual());
    const q = this.route.snapshot.queryParamMap;
    if (q.get('lat') && q.get('lng')) {
      this.elegir({ lat: +q.get('lat')!, lng: +q.get('lng')!, nombre: q.get('nombre') ?? 'Destino' });
    }
  }

  escribir(t: string) { this.busqueda$.next(t); }

  elegir(p: Punto) {
    this.destino.set(p);
    this.texto = p.nombre;
    this.resultados.set([]);
    const o = this.origen();
    if (!o) return;
    this.calculando.set(true);
    this.geo.ruta(o, p).subscribe((r) => {
      this.ruta.set(r.puntos);
      this.km.set(r.km);
      this.min.set(r.min);
      this.calculando.set(false);
    });
  }

  /** Tocar el mapa también sirve para escoger destino. */
  tocarMapa(p: { lat: number; lng: number }) {
    this.geo.nombreDe(p).subscribe((nombre) => this.elegir({ ...p, nombre }));
  }

  limpiar() {
    this.destino.set(null);
    this.ruta.set([]);
    this.texto = '';
    this.resultados.set([]);
  }

  precio(t: TipoServicio) { return this.viajes.precio(t, this.km()); }

  llegada(extraMin: number) {
    const d = new Date(Date.now() + (this.min() + extraMin) * 60000);
    return d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  }

  confirmar() {
    const o = this.origen(), d = this.destino();
    if (!o || !d) return;
    this.enviando.set(true);
    this.viajes.solicitar(o, d, this.tipo(), this.km()).subscribe({
      next: (v) => { this.enviando.set(false); this.router.navigate(['/viaje', v.id], { replaceUrl: true }); },
      error: async (e) => {
        this.enviando.set(false);
        (await this.toast.create({ message: mensajeError(e), duration: 3500, color: 'danger' })).present();
      },
    });
  }

  servicioSel() { return this.servicios.find((s) => s.tipo === this.tipo()); }

  volver() { this.router.navigateByUrl('/tabs/inicio'); }
}
