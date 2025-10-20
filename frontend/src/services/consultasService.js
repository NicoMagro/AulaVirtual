import api from './api';

const consultasService = {
  /**
   * Crear una nueva consulta
   * Accesible por estudiantes y profesores del aula
   */
  crearConsulta: async (datos) => {
    // datos: { aula_id, titulo, pregunta, publica, hoja_id?, bloque_id?, archivo_id? }
    const response = await api.post('/consultas', datos);
    return response.data;
  },

  /**
   * Obtener todas las consultas de un aula
   * Accesible por profesores y estudiantes del aula
   */
  obtenerConsultasAula: async (aula_id) => {
    const response = await api.get(`/consultas/aula/${aula_id}`);
    return response.data;
  },

  /**
   * Obtener detalle de una consulta con sus respuestas
   * Accesible por profesores y estudiantes del aula
   */
  obtenerConsultaDetalle: async (consulta_id) => {
    const response = await api.get(`/consultas/${consulta_id}`);
    return response.data;
  },

  /**
   * Crear una respuesta a una consulta
   * Si la consulta es privada, solo profesores pueden responder
   * Si es pública, tanto estudiantes como profesores pueden responder
   */
  crearRespuesta: async (consulta_id, respuesta) => {
    const response = await api.post(`/consultas/${consulta_id}/respuestas`, {
      respuesta,
    });
    return response.data;
  },

  /**
   * Marcar una consulta como resuelta (toggle)
   * Solo el creador de la consulta puede marcarla como resuelta
   */
  marcarComoResuelta: async (consulta_id) => {
    const response = await api.put(`/consultas/${consulta_id}/resuelta`);
    return response.data;
  },

  /**
   * Eliminar una consulta
   * Solo el creador o profesores del aula pueden eliminar
   */
  eliminarConsulta: async (consulta_id) => {
    const response = await api.delete(`/consultas/${consulta_id}`);
    return response.data;
  },

  /**
   * Eliminar una respuesta
   * Solo el autor de la respuesta o profesores del aula pueden eliminar
   */
  eliminarRespuesta: async (respuesta_id) => {
    const response = await api.delete(`/consultas/respuestas/${respuesta_id}`);
    return response.data;
  },

  /**
   * Subir imagen a una consulta
   * Solo el creador de la consulta puede subir imágenes
   */
  subirImagenConsulta: async (consulta_id, imagenFile) => {
    const formData = new FormData();
    formData.append('imagen', imagenFile);
    const response = await api.post(`/consultas/${consulta_id}/imagenes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Subir imagen a una respuesta
   * Solo el autor de la respuesta puede subir imágenes
   */
  subirImagenRespuesta: async (respuesta_id, imagenFile) => {
    const formData = new FormData();
    formData.append('imagen', imagenFile);
    const response = await api.post(`/consultas/respuestas/${respuesta_id}/imagenes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Eliminar una imagen
   * Solo el que subió la imagen o profesores pueden eliminar
   */
  eliminarImagen: async (imagen_id) => {
    const response = await api.delete(`/consultas/imagenes/${imagen_id}`);
    return response.data;
  },

  /**
   * Obtener URL de imagen
   */
  obtenerUrlImagen: (nombre_archivo) => {
    return `http://localhost:5001/uploads/consultas/${nombre_archivo}`;
  },
};

export default consultasService;
