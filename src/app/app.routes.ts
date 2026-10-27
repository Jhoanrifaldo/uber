import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/inicio', pathMatch: 'full' },
  { path: 'login', canActivate: [invitadoGuard], loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  { path: 'registro', canActivate: [invitadoGuard], loadComponent: () => import('./pages/registro/registro.page').then((m) => m.RegistroPage) },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'inicio', loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage) },
      { path: 'viajes', loadComponent: () => import('./pages/viajes/viajes.page').then((m) => m.ViajesPage) },
      { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage) },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  { path: 'solicitar', canActivate: [authGuard], loadComponent: () => import('./pages/solicitar/solicitar.page').then((m) => m.SolicitarPage) },
  { path: 'viaje/:id', canActivate: [authGuard], loadComponent: () => import('./pages/viaje-activo/viaje-activo.page').then((m) => m.ViajeActivoPage) },
  { path: '**', redirectTo: 'tabs/inicio' },
];
