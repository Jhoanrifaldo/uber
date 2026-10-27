import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSpinner, IonText, IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../core/services/errores';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonInput, IonButton, IonSpinner, IonText],
  template: `
  <ion-header class="ion-no-border">
    <ion-toolbar><ion-buttons slot="start"><ion-back-button defaultHref="/login" text=""></ion-back-button></ion-buttons></ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <form (ngSubmit)="crear()" #f="ngForm" class="form">
      <h1 class="titulo">Crea tu cuenta</h1>
      <ion-input class="campo" fill="outline" label="Nombre completo" labelPlacement="floating" name="name" [(ngModel)]="d.name" required></ion-input>
      <ion-input class="campo" fill="outline" label="Correo" labelPlacement="floating" type="email" name="email" [(ngModel)]="d.email" required email></ion-input>
      <ion-input class="campo" fill="outline" label="Celular" labelPlacement="floating" type="tel" name="telefono" [(ngModel)]="d.telefono"></ion-input>
      <ion-input class="campo" fill="outline" label="Contraseña (mín. 8)" labelPlacement="floating" type="password" name="password" [(ngModel)]="d.password" required minlength="8"></ion-input>

      @if (error()) { <ion-text color="danger"><p class="err">{{ error() }}</p></ion-text> }

      <ion-button class="btn-negro" expand="block" type="submit" [disabled]="cargando() || f.invalid">
        @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Registrarme }
      </ion-button>
    </form>
  </ion-content>`,
  styles: [`.form{max-width:420px;margin:0 auto}.campo{margin-bottom:14px;--border-radius:10px}.err{white-space:pre-line;font-size:14px}`],
})
export class RegistroPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  d = { name: '', email: '', telefono: '', password: '' };
  cargando = signal(false);
  error = signal('');

  crear() {
    this.cargando.set(true);
    this.error.set('');
    this.auth.registrar(this.d).subscribe({
      next: () => { this.cargando.set(false); this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true }); },
      error: (e) => { this.cargando.set(false); this.error.set(mensajeError(e)); },
    });
  }
}
