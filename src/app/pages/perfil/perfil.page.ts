import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonNote,
  IonTitle, IonToggle, IonToolbar, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { helpCircleOutline, logOutOutline, mailOutline, serverOutline, walletOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonListHeader, IonItem, IonLabel,
    IonIcon, IonInput, IonToggle, IonNote, IonButton],
  template: `
  <ion-header class="ion-no-border"><ion-toolbar><ion-title>Cuenta</ion-title></ion-toolbar></ion-header>
  <ion-content>
    <div class="usuario">
      <div>
        <h2>{{ auth.usuario()?.name }}</h2>
        <p class="muted">{{ auth.usuario()?.email }}</p>
      </div>
      <div class="avatar">{{ (auth.usuario()?.name ?? '?').charAt(0) }}</div>
    </div>

    <ion-list lines="full">
      <ion-item><ion-icon slot="start" name="wallet-outline"></ion-icon><ion-label>Pagos</ion-label><ion-note slot="end">Efectivo</ion-note></ion-item>
      <ion-item><ion-icon slot="start" name="mail-outline"></ion-icon><ion-label>Mensajes</ion-label></ion-item>
      <ion-item><ion-icon slot="start" name="help-circle-outline"></ion-icon><ion-label>Ayuda</ion-label></ion-item>
    </ion-list>

    <ion-list lines="full">
      <ion-list-header><ion-label><ion-icon name="server-outline"></ion-icon> Conexión con el servidor</ion-label></ion-list-header>
      <ion-item>
        <ion-toggle [(ngModel)]="mock">Modo demo (sin backend)</ion-toggle>
      </ion-item>
      <ion-item>
        <ion-input label="URL del API" labelPlacement="stacked" [(ngModel)]="url" [disabled]="mock"
          placeholder="http://192.168.1.10:8000/api"></ion-input>
      </ion-item>
    </ion-list>
    <div class="ion-padding">
      <ion-button class="btn-negro" expand="block" (click)="guardar()">Guardar conexión</ion-button>
      <ion-button expand="block" fill="clear" color="danger" (click)="salir()">
        <ion-icon slot="start" name="log-out-outline"></ion-icon> Cerrar sesión
      </ion-button>
    </div>
  </ion-content>`,
  styles: [`
    ion-title{font-weight:700;font-size:22px}
    .usuario{display:flex;justify-content:space-between;align-items:center;padding:12px 20px 20px}
    .usuario h2{font-size:26px;font-weight:800;margin:0}
    .usuario p{margin:4px 0 0}
    .avatar{width:60px;height:60px;border-radius:50%;background:#000;color:#fff;display:grid;place-items:center;
      font-size:26px;font-weight:700}
    ion-list-header ion-icon{vertical-align:-2px;margin-right:4px}
  `],
})
export class PerfilPage {
  auth = inject(AuthService);
  private cfg = inject(ConfigService);
  private router = inject(Router);
  private toast = inject(ToastController);

  url = this.cfg.apiUrl();
  mock = this.cfg.useMock();

  constructor() { addIcons({ walletOutline, mailOutline, helpCircleOutline, serverOutline, logOutOutline }); }

  async guardar() {
    const cambioModo = this.mock !== this.cfg.useMock();
    this.cfg.guardar(this.url, this.mock);
    (await this.toast.create({ message: 'Conexión guardada', duration: 1800, color: 'success' })).present();
    // Al cambiar entre demo y backend real hay que volver a iniciar sesión
    if (cambioModo) { this.auth.limpiar(); this.router.navigateByUrl('/login', { replaceUrl: true }); }
  }

  salir() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login', { replaceUrl: true }));
  }
}
