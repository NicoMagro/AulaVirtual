import api from './api';

const notificacionesService = {
  /**
   * Obtener notificaciones del usuario autenticado
   * @param {Object} params - Parámetros opcionales { limit, offset, solo_no_leidas }
   */
  obtenerNotificaciones: async (params = {}) => {
    const response = await api.get('/notificaciones', { params });
    return response.data;
  },

  /**
   * Marcar una notificación como leída
   * @param {string} notificacion_id - ID de la notificación
   */
  marcarComoLeida: async (notificacion_id) => {
    const response = await api.put(`/notificaciones/${notificacion_id}/leida`);
    return response.data;
  },

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasComoLeidas: async () => {
    const response = await api.put('/notificaciones/marcar-todas-leidas');
    return response.data;
  },

  /**
   * Eliminar una notificación
   * @param {string} notificacion_id - ID de la notificación
   */
  eliminarNotificacion: async (notificacion_id) => {
    const response = await api.delete(`/notificaciones/${notificacion_id}`);
    return response.data;
  },
};

export default notificacionesService;
