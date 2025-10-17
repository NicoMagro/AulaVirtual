import api from './api';

const aulasService = {
  // ============================================
  // FUNCIONES PARA ADMINISTRADORES
  // ============================================

  /**
   * Crear una nueva aula (solo admin)
   */
  crearAula: async (datos) => {
    const response = await api.post('/aulas', datos);
    return response.data;
  },

  /**
   * Listar todas las aulas
   */
  listarAulas: async (activo = true) => {
    const response = await api.get('/aulas', {
      params: { activo },
    });
    return response.data;
  },

  /**
   * Obtener un aula por ID
   */
  obtenerAula: async (id) => {
    const response = await api.get(`/aulas/${id}`);
    return response.data;
  },

  /**
   * Actualizar un aula (solo admin)
   */
  actualizarAula: async (id, datos) => {
    const response = await api.put(`/aulas/${id}`, datos);
    return response.data;
  },

  /**
   * Desactivar un aula (solo admin)
   */
  eliminarAula: async (id) => {
    const response = await api.delete(`/aulas/${id}`);
    return response.data;
  },

  /**
   * Asignar un profesor a un aula (solo admin)
   */
  asignarProfesor: async (aula_id, profesor_id) => {
    const response = await api.post('/aulas/asignar-profesor', {
      aula_id,
      profesor_id,
    });
    return response.data;
  },

  /**
   * Desasignar un profesor de un aula (solo admin)
   */
  desasignarProfesor: async (aula_id, profesor_id) => {
    const response = await api.delete(`/aulas/${aula_id}/profesores/${profesor_id}`);
    return response.data;
  },

  // ============================================
  // FUNCIONES PARA PROFESORES
  // ============================================

  /**
   * Obtener aulas donde el profesor está asignado
   */
  misAulasProfesor: async () => {
    const response = await api.get('/aulas/mis-aulas-profesor');
    return response.data;
  },
};

export default aulasService;
