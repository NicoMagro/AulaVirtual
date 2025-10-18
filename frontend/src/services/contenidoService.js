import api from './api';

const contenidoService = {
  /**
   * Obtener todo el contenido de una hoja de un aula
   * Accesible por profesores asignados y estudiantes matriculados
   */
  obtenerContenidoAula: async (aula_id, hoja_id) => {
    const response = await api.get(`/contenido/aula/${aula_id}`, {
      params: { hoja_id },
    });
    return response.data;
  },

  /**
   * Crear un nuevo bloque de contenido
   * Solo profesores asignados al aula
   */
  crearBloque: async (datos) => {
    const response = await api.post('/contenido/bloque', datos);
    return response.data;
  },

  /**
   * Actualizar un bloque de contenido existente
   * Solo profesores asignados al aula
   */
  actualizarBloque: async (bloque_id, datos) => {
    const response = await api.put(`/contenido/bloque/${bloque_id}`, datos);
    return response.data;
  },

  /**
   * Eliminar un bloque de contenido
   * Solo profesores asignados al aula
   */
  eliminarBloque: async (bloque_id) => {
    const response = await api.delete(`/contenido/bloque/${bloque_id}`);
    return response.data;
  },

  /**
   * Reordenar bloques de contenido
   * Solo profesores asignados al aula
   */
  reordenarBloques: async (aula_id, bloques) => {
    const response = await api.put('/contenido/reordenar', {
      aula_id,
      bloques,
    });
    return response.data;
  },
};

export default contenidoService;
