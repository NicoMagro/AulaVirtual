import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token y rol activo a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Agregar el rol activo del usuario en cada petición
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const rolActivo = localStorage.getItem('rolActivo') || user.roles?.[0];
    if (rolActivo) {
      config.headers['x-rol-activo'] = rolActivo;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir a login si es un 401 Y no estamos en las rutas de autenticación
    const isAuthRequest = error.config?.url?.includes('/auth/login') ||
                          error.config?.url?.includes('/auth/registro');

    if (error.response?.status === 401 && !isAuthRequest) {
      // Token inválido o expirado en ruta protegida
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
