import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, homeOutline, person, personOutline, receipt, receiptOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
  <ion-tabs>
    <ion-tab-bar slot="bottom">
      <ion-tab-button tab="inicio"><ion-icon name="home-outline"></ion-icon><ion-label>Inicio</ion-label></ion-tab-button>
      <ion-tab-button tab="viajes"><ion-icon name="receipt-outline"></ion-icon><ion-label>Actividad</ion-label></ion-tab-button>
      <ion-tab-button tab="perfil"><ion-icon name="person-outline"></ion-icon><ion-label>Cuenta</ion-label></ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>`,
  styles: [`ion-tab-bar{--color:#8a8a8a;--color-selected:#000;border-top:1px solid #eee}`],
})
export class TabsPage {
  constructor() { addIcons({ home, homeOutline, receipt, receiptOutline, person, personOutline }); }
}
