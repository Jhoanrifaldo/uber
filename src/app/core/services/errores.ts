import { HttpErrorResponse } from '@angular/common/http';

/** Convierte errores de Laravel (validación 422, 401, sin conexión) en un texto legible. */
export function mensajeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'No hay conexión con el servidor. Revisa la IP en Perfil → Conexión.';
    const b = e.error;
    if (b?.errors) return Object.values(b.errors).flat().join('\n');
    if (b?.message) return b.message;
    if (e.status === 401) return 'Correo o contraseña incorrectos.';
    return `Error ${e.status}`;
  }
  return (e as Error)?.message ?? 'Ocurrió un error';
}
