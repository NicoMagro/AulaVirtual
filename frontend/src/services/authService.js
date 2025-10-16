import api from './api';

const authService = {
  // Registrar nuevo usuario
  registro: async (datos) => {
    try {
      const response = await api.post('/auth/registro', datos);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.usuario));
        return response.data;
      } else {
        // Si la respuesta no es exitosa, lanzar error
        throw new Error(response.data.message || 'Error al registrar usuario');
      }
    } catch (error) {
      // Re-lanzar el error para que lo capture el componente
      throw error;
    }
  },

  // Iniciar sesión
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.usuario));
        return response.data;
      } else {
        // Si la respuesta no es exitosa, lanzar error
        throw new Error(response.data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      // Re-lanzar el error para que lo capture el componente
      throw error;
    }
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
