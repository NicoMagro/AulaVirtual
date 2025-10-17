import api from './api';

const matriculacionService = {
  // ============================================
  // FUNCIONES PARA PROFESORES
  // ============================================

  /**
   * Gestionar clave de matriculación (crear, actualizar, eliminar)
   * @param {string} aula_id - ID del aula
   * @param {string|null} clave_matriculacion - Clave (null para aula pública)
   */
  gestionarClaveMatriculacion: async (aula_id, clave_matriculacion) => {
    const response = await api.put('/matriculacion/aula/clave', {
      aula_id,
      clave_matriculacion,
    });
    return response.data;
  },

  /**
   * Obtener lista de estudiantes de un aula
   */
  obtenerEstudiantesAula: async (aula_id) => {
    const response = await api.get(`/matriculacion/aula/${aula_id}/estudiantes`);
    return response.data;
  },

  // ============================================
  // FUNCIONES PARA ESTUDIANTES
  // ============================================

  /**
   * Listar aulas disponibles para matriculación
   */
  listarAulasDisponibles: async () => {
    const response = await api.get('/matriculacion/aulas-disponibles');
    return response.data;
  },

  /**
   * Matricularse en un aula
   * @param {string} aula_id - ID del aula
   * @param {string|null} clave_matriculacion - Clave si el aula la requiere
   */
  matricularseEnAula: async (aula_id, clave_matriculacion = null) => {
    const response = await api.post('/matriculacion/matricularse', {
      aula_id,
      clave_matriculacion,
    });
    return response.data;
  },

  /**
   * Listar aulas donde el estudiante está matriculado
   */
  misAulas: async () => {
    const response = await api.get('/matriculacion/mis-aulas');
    return response.data;
  },

  /**
   * Desmatricularse de un aula
   */
  desmatricularseDeAula: async (aula_id) => {
    const response = await api.delete(`/matriculacion/desmatricularse/${aula_id}`);
    return response.data;
  },
};

export default matriculacionService;
