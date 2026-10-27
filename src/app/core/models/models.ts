export interface Usuario {
  id: number;
  name: string;
  email: string;
  telefono?: string;
}

export interface Punto {
  lat: number;
  lng: number;
  nombre: string;
}

export type TipoServicio = 'moto' | 'economico' | 'confort' | 'xl';

export type EstadoViaje = 'buscando' | 'asignado' | 'llegando' | 'en_curso' | 'finalizado' | 'cancelado';

export interface Conductor {
  nombre: string;
  placa: string;
  vehiculo: string;
  calificacion: number;
  telefono?: string;
}

export interface Viaje {
  id: number;
  origen: string;
  destino: string;
  origen_lat: number;
  origen_lng: number;
  destino_lat: number;
  destino_lng: number;
  tipo: TipoServicio;
  precio: number;
  distancia_km: number;
  estado: EstadoViaje;
  conductor?: Conductor | null;
  calificacion?: number | null;
  created_at: string;
}

export interface OpcionServicio {
  tipo: TipoServicio;
  nombre: string;
  descripcion: string;
  icono: string;      // emoji
  pasajeros: number;
  base: number;       // tarifa base COP
  porKm: number;      // COP por km
}
