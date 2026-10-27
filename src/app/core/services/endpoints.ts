/**
 * Rutas del API de Laravel. Si el backend del profesor usa otros nombres,
 * SOLO hay que cambiarlos aquí.
 */
export const ENDPOINTS = {
  login: '/login',               // POST {email, password} -> {token, user}
  register: '/register',         // POST {name, email, password, password_confirmation, telefono}
  logout: '/logout',             // POST
  me: '/user',                   // GET -> user
  viajes: '/viajes',             // GET lista / POST crear
  viaje: (id: number) => `/viajes/${id}`,                  // GET detalle
  cancelar: (id: number) => `/viajes/${id}/cancelar`,      // PUT
  calificar: (id: number) => `/viajes/${id}/calificar`,    // PUT {calificacion}
};
