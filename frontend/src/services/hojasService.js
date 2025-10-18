import api from './api';

const hojasService = {
  /**
   * Obtener todas las hojas de un aula
   * Accesible por profesores asignados, estudiantes matriculados y admin
   */
  obtenerHojasAula: async (aula_id) => {
    const response = await api.get(`/hojas/aula/${aula_id}`);
    return response.data;
  },

  /**
   * Crear una nueva hoja en un aula
   * Solo profesores asignados al aula
   */
  crearHoja: async (datos) => {
    const response = await api.post('/hojas', datos);
    return response.data;
  },

  /**
   * Actualizar una hoja existente
   * Solo profesores asignados al aula
   */
  actualizarHoja: async (hoja_id, datos) => {
    const response = await api.put(`/hojas/${hoja_id}`, datos);
    return response.data;
  },

  /**
   * Eliminar una hoja
   * Solo profesores asignados al aula
   */
  eliminarHoja: async (hoja_id) => {
    const response = await api.delete(`/hojas/${hoja_id}`);
    return response.data;
  },

  /**
   * Reordenar hojas de un aula
   * Solo profesores asignados al aula
   */
  reordenarHojas: async (aula_id, hojas) => {
    const response = await api.put('/hojas/reordenar/bulk', {
      aula_id,
      hojas,
    });
    return response.data;
  },
};

export default hojasService;
