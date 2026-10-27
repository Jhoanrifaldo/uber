import {
  AfterViewInit, Component, ElementRef, OnDestroy, effect, input, output, viewChild,
} from '@angular/core';
import * as L from 'leaflet';

type LatLng = { lat: number; lng: number };

/** Mapa Leaflet + OpenStreetMap. No necesita API key. */
@Component({
  selector: 'app-mapa',
  standalone: true,
  template: `<div #el class="mapa"></div>`,
  styles: [`:host{display:block;width:100%;height:100%} .mapa{width:100%;height:100%;background:#e8e8e8}`],
})
export class MapaComponent implements AfterViewInit, OnDestroy {
  origen = input<LatLng | null>(null);
  destino = input<LatLng | null>(null);
  conductor = input<LatLng | null>(null);
  ruta = input<[number, number][]>([]);
  /** Margen inferior (px) para que el bottom sheet no tape la ruta. */
  margenAbajo = input<number>(260);
  tocado = output<LatLng>();

  private el = viewChild.required<ElementRef<HTMLDivElement>>('el');
  private map?: L.Map;
  private mOrigen?: L.Marker;
  private mDestino?: L.Marker;
  private mAuto?: L.Marker;
  private linea?: L.Polyline;
  private ro?: ResizeObserver;

  private iconos = {
    origen: L.divIcon({ className: 'mk', html: '<div class="mk-origen"></div>', iconSize: [26, 26], iconAnchor: [13, 13] }),
    destino: L.divIcon({ className: 'mk', html: '<div class="mk-destino"></div>', iconSize: [24, 24], iconAnchor: [12, 12] }),
    auto: L.divIcon({ className: 'mk', html: '<div class="mk-auto">🚗</div>', iconSize: [34, 34], iconAnchor: [17, 17] }),
  };

  constructor() {
    effect(() => {
      const o = this.origen(), d = this.destino(), c = this.conductor(), r = this.ruta();
      if (this.map) this.dibujar(o, d, c, r);
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.el().nativeElement, { zoomControl: false, attributionControl: true })
      .setView([4.6097, -74.0817], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap © CARTO',
    }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => this.tocado.emit({ lat: e.latlng.lat, lng: e.latlng.lng }));

    // Ionic monta la página antes de que tenga tamaño: recalculamos cuando cambie.
    this.ro = new ResizeObserver(() => this.map?.invalidateSize());
    this.ro.observe(this.el().nativeElement);
    this.dibujar(this.origen(), this.destino(), this.conductor(), this.ruta());
  }

  ngOnDestroy() {
    this.ro?.disconnect();
    this.map?.remove();
  }

  private dibujar(o: LatLng | null, d: LatLng | null, c: LatLng | null, r: [number, number][]) {
    const m = this.map!;
    this.mOrigen = this.poner(this.mOrigen, o, this.iconos.origen);
    this.mDestino = this.poner(this.mDestino, d, this.iconos.destino);
    this.mAuto = this.poner(this.mAuto, c, this.iconos.auto);

    this.linea?.remove();
    this.linea = r.length > 1 ? L.polyline(r, { color: '#000', weight: 5, opacity: 0.9 }).addTo(m) : undefined;

    const pts: L.LatLngExpression[] = [o, d, c].filter((p): p is LatLng => !!p).map((p) => [p.lat, p.lng]);
    if (pts.length > 1 || r.length > 1) {
      const b = L.latLngBounds(r.length > 1 ? [...r, ...pts] : pts);
      m.fitBounds(b, { paddingTopLeft: [40, 90], paddingBottomRight: [40, this.margenAbajo()], maxZoom: 16 });
    } else if (pts.length === 1) {
      m.setView(pts[0], 16);
    }
  }

  private poner(mk: L.Marker | undefined, p: LatLng | null, icon: L.DivIcon) {
    if (!p) { mk?.remove(); return undefined; }
    if (mk) { mk.setLatLng([p.lat, p.lng]); return mk; }
    return L.marker([p.lat, p.lng], { icon }).addTo(this.map!);
  }
}
