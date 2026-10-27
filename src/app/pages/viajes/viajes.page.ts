import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonRefresher, IonRefresherContent, IonSpinner, IonTitle, IonToolbar, ViewWillEnter,
} from '@ionic/angular/standalone';
import { EstadoViaje, Viaje } from '../../core/models/models';
import { mensajeError } from '../../core/services/errores';
import { SERVICIOS, ViajeService } from '../../core/services/viaje.service';

@Component({
  selector: 'app-viajes',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonSpinner],
  template: `
  <ion-header class="ion-no-border"><ion-toolbar><ion-title>Actividad</ion-title></ion-toolbar></ion-header>
  <ion-content class="ion-padding">
    <ion-refresher slot="fixed" (ionRefresh)="cargar($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>

    @if (cargando()) {
      <div class="centro"><ion-spinner name="crescent"></ion-spinner></div>
    } @else if (error()) {
      <p class="centro muted">{{ error() }}</p>
    } @else if (!lista().length) {
      <div class="vacio">
        <div class="em">🧾</div>
        <b>Aún no tienes viajes</b>
        <p class="muted">Cuando pidas tu primer viaje aparecerá aquí.</p>
      </div>
    } @else {
      @for (v of lista(); track v.id) {
        <button class="item" (click)="abrir(v)">
          <span class="emoji">{{ icono(v) }}</span>
          <span class="info">
            <b>{{ v.destino.split(',')[0] }}</b>
            <small>{{ v.created_at | date: 'd MMM, h:mm a' }}</small>
            <span class="estado" [attr.data-e]="v.estado">{{ etiqueta(v.estado) }}</span>
          </span>
          <span class="precio">{{ v.precio | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</span>
        </button>
      }
    }
  </ion-content>`,
  styles: [`
    ion-title{font-weight:700;font-size:22px}
    .centro{text-align:center;padding:40px 0}
    .vacio{text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:6px}
    .vacio .em{font-size:48px}
    .item{width:100%;display:flex;align-items:center;gap:14px;background:none;border:0;border-bottom:1px solid #f0f0f0;
      padding:14px 0;text-align:left;font:inherit;color:inherit}
    .emoji{width:52px;height:52px;border-radius:12px;background:#f3f3f3;display:grid;place-items:center;font-size:26px;flex:none}
    .info{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
    .info b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .info small{color:#6b6b6b}
    .estado{font-size:12px;font-weight:600;color:#6b6b6b}
    .estado[data-e=finalizado]{color:#06c167}
    .estado[data-e=cancelado]{color:#e11900}
    .precio{font-weight:700}
  `],
})
export class ViajesPage implements ViewWillEnter {
  private viajes = inject(ViajeService);
  private router = inject(Router);
  lista = signal<Viaje[]>([]);
  cargando = signal(true);
  error = signal('');

  ionViewWillEnter() { this.cargar(); }

  cargar(ev?: CustomEvent) {
    if (!ev) this.cargando.set(true);
    this.viajes.listar().subscribe({
      next: (l) => { this.lista.set(l); this.error.set(''); this.cargando.set(false); (ev?.target as any)?.complete(); },
      error: (e) => { this.error.set(mensajeError(e)); this.cargando.set(false); (ev?.target as any)?.complete(); },
    });
  }

  abrir(v: Viaje) {
    if (!['finalizado', 'cancelado'].includes(v.estado)) this.router.navigate(['/viaje', v.id]);
  }

  icono(v: Viaje) { return SERVICIOS.find((s) => s.tipo === v.tipo)?.icono ?? '🚗'; }

  etiqueta(e: EstadoViaje) {
    return { buscando: 'Buscando conductor', asignado: 'Conductor asignado', llegando: 'Conductor en camino',
      en_curso: 'En curso', finalizado: 'Completado', cancelado: 'Cancelado' }[e];
  }
}
