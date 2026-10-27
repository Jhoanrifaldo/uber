# RutaYa — front estilo Uber (Ionic + Angular)

## Correr
```
npm install
npm start          # abre http://localhost:4200
```

## Conectar al Laravel del profesor
Por defecto está en **modo demo** (funciona sin backend).
Para usar el real: en la app ve a **Cuenta → Conexión con el servidor**, apaga "Modo demo"
y pon la URL, ej. `http://192.168.1.10:8000/api`.
(También se cambia en `src/environments/environment.ts`.)

Las rutas del API están en `src/app/core/services/endpoints.ts` — si el profe usa otros nombres, cámbialos ahí.

## Pantallas
Login · Registro · Inicio (mapa) · Pedir viaje · Viaje en curso · Actividad (historial) · Cuenta.
Mapa con Leaflet + OpenStreetMap, sin API key.
