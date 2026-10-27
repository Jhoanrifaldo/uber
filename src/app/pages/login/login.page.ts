import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonSpinner, IonText } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { ConfigService } from '../../core/services/config.service';
import { mensajeError } from '../../core/services/errores';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonButton, IonSpinner, IonText],
  template: `
  <ion-content class="ion-padding">
    <div class="hero">
      <div class="logo">RutaYa</div>
      <p>Muévete por tu ciudad en minutos.</p>
    </div>

    <form (ngSubmit)="entrar()" class="form">
      <h1 class="titulo">Inicia sesión</h1>
      <ion-input class="campo" fill="outline" label="Correo" labelPlacement="floating" type="email"
        name="email" [(ngModel)]="email" required autocomplete="email"></ion-input>
      <ion-input class="campo" fill="outline" label="Contraseña" labelPlacement="floating" type="password"
        name="password" [(ngModel)]="password" required autocomplete="current-password"></ion-input>

      @if (error()) { <ion-text color="danger"><p class="err">{{ error() }}</p></ion-text> }

      <ion-button class="btn-negro" expand="block" type="submit" [disabled]="cargando() || !email || !password">
        @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Continuar }
      </ion-button>

      <p class="alt">¿No tienes cuenta? <a routerLink="/registro">Regístrate</a></p>
      @if (cfg.useMock()) { <p class="demo">Modo demo activo: cualquier correo y contraseña funcionan.</p> }
    </form>
  </ion-content>`,
  styles: [`
    .hero{background:#000;color:#fff;margin:calc(-1 * var(--padding-top)) calc(-1 * var(--padding-end)) 0;
      padding:calc(64px + var(--ion-safe-area-top,0px)) 24px 40px}
    .logo{font-size:34px;font-weight:800;letter-spacing:-1px}
    .hero p{margin:6px 0 0;opacity:.75}
    .form{max-width:420px;margin:28px auto 0}
    .campo{margin-bottom:14px;--border-radius:10px}
    .err{white-space:pre-line;font-size:14px}
    .alt{text-align:center;margin-top:20px}
    .alt a{color:#000;font-weight:600}
    .demo{text-align:center;font-size:12px;color:var(--ion-color-medium);background:var(--ion-color-light);
      padding:8px;border-radius:8px}
  `],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  cfg = inject(ConfigService);

  email = '';
  password = '';
  cargando = signal(false);
  error = signal('');

  entrar() {
    this.cargando.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.cargando.set(false); this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true }); },
      error: (e) => { this.cargando.set(false); this.error.set(mensajeError(e)); },
    });
  }
}
