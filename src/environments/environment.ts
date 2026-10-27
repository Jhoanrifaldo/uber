/**
 * Configuración por defecto. También se puede cambiar desde la app:
 * Perfil → "Conexión con el servidor" (se guarda en el navegador).
 */
export const environment = {
  // IP de la máquina donde corre el Laravel del profesor (php artisan serve --host=0.0.0.0 --port=8000)
  apiUrl: 'http://192.168.1.10:8000/api',
  // true = funciona sin backend con datos simulados. Pásalo a false cuando tengas la IP.
  useMock: true,
};
