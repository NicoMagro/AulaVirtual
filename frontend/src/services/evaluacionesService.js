import api from './api';

const evaluacionesService = {
  // ==========================================
  // EVALUACIONES
  // ==========================================

  /**
   * Crear una nueva evaluación
   */
  crear: async (datosEvaluacion) => {
    const response = await api.post('/evaluaciones', datosEvaluacion);
    return response.data;
  },

  /**
   * Obtener todas las evaluaciones de un aula
   */
  obtenerPorAula: async (aulaId) => {
    const response = await api.get(`/evaluaciones/aula/${aulaId}`);
    return response.data;
  },

  /**
   * Obtener detalle de una evaluación
   */
  obtenerDetalle: async (evaluacionId) => {
    const response = await api.get(`/evaluaciones/${evaluacionId}`);
    return response.data;
  },

  /**
   * Actualizar una evaluación
   */
  actualizar: async (evaluacionId, datosActualizados) => {
    const response = await api.put(`/evaluaciones/${evaluacionId}`, datosActualizados);
    return response.data;
  },

  /**
   * Eliminar una evaluación
   */
  eliminar: async (evaluacionId) => {
    const response = await api.delete(`/evaluaciones/${evaluacionId}`);
    return response.data;
  },

  // ==========================================
  // PREGUNTAS
  // ==========================================

  /**
   * Crear una nueva pregunta en el banco
   */
  crearPregunta: async (datosPregunta) => {
    const response = await api.post('/preguntas', datosPregunta);
    return response.data;
  },

  /**
   * Obtener todas las preguntas de una evaluación
   */
  obtenerPreguntas: async (evaluacionId) => {
    const response = await api.get(`/preguntas/evaluacion/${evaluacionId}`);
    return response.data;
  },

  /**
   * Obtener detalle de una pregunta
   */
  obtenerPreguntaDetalle: async (preguntaId) => {
    const response = await api.get(`/preguntas/${preguntaId}`);
    return response.data;
  },

  /**
   * Actualizar una pregunta
   */
  actualizarPregunta: async (preguntaId, datosActualizados) => {
    const response = await api.put(`/preguntas/${preguntaId}`, datosActualizados);
    return response.data;
  },

  /**
   * Eliminar una pregunta
   */
  eliminarPregunta: async (preguntaId) => {
    const response = await api.delete(`/preguntas/${preguntaId}`);
    return response.data;
  },

  // ==========================================
  // INTENTOS
  // ==========================================

  /**
   * Iniciar un nuevo intento de evaluación
   */
  iniciarIntento: async (evaluacionId) => {
    const response = await api.post('/intentos/iniciar', {
      evaluacion_id: evaluacionId,
    });
    return response.data;
  },

  /**
   * Obtener detalles de un intento
   */
  obtenerIntento: async (intentoId) => {
    const response = await api.get(`/intentos/${intentoId}`);
    return response.data;
  },

  /**
   * Guardar respuesta de una pregunta
   */
  guardarRespuesta: async (intentoId, datosRespuesta) => {
    const response = await api.post(`/intentos/${intentoId}/respuesta`, datosRespuesta);
    return response.data;
  },

  /**
   * Entregar el intento
   */
  entregarIntento: async (intentoId) => {
    const response = await api.post(`/intentos/${intentoId}/entregar`);
    return response.data;
  },

  /**
   * Obtener mis intentos en una evaluación
   */
  obtenerMisIntentos: async (evaluacionId) => {
    const response = await api.get(`/intentos/evaluacion/${evaluacionId}/mis-intentos`);
    return response.data;
  },

  // ==========================================
  // CALIFICACIÓN MANUAL
  // ==========================================

  /**
   * Obtener intentos pendientes de calificación de una evaluación
   */
  obtenerIntentosPendientes: async (evaluacionId) => {
    const response = await api.get(`/intentos/evaluacion/${evaluacionId}/pendientes`);
    return response.data;
  },

  /**
   * Obtener intento con todas las respuestas para calificar
   */
  obtenerIntentoParaCalificar: async (intentoId) => {
    const response = await api.get(`/intentos/${intentoId}/calificar`);
    return response.data;
  },

  /**
   * Calificar una respuesta individual
   */
  calificarRespuesta: async (intentoId, respuestaId, datosCalificacion) => {
    const response = await api.put(`/intentos/${intentoId}/respuesta/${respuestaId}/calificar`, datosCalificacion);
    return response.data;
  },

  /**
   * Publicar resultados del intento (recalcular nota y cambiar estado)
   */
  publicarResultados: async (intentoId) => {
    const response = await api.post(`/intentos/${intentoId}/publicar`);
    return response.data;
  },

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  /**
   * Obtener estadísticas de una evaluación
   */
  obtenerEstadisticas: async (evaluacionId) => {
    const response = await api.get(`/evaluaciones/${evaluacionId}/estadisticas`);
    return response.data;
  },

  /**
   * Exportar estadísticas a Excel
   */
  exportarEstadisticasExcel: async (evaluacionId) => {
    const response = await api.get(`/evaluaciones/${evaluacionId}/exportar-excel`, {
      responseType: 'blob', // Importante para archivos binarios
    });

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Obtener el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'Estadisticas_Evaluacion.xlsx';

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2) {
        fileName = fileNameMatch[1];
      }
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
  },

  /**
   * Exportar estadísticas a PDF
   */
  exportarEstadisticasPDF: async (evaluacionId) => {
    const response = await api.get(`/evaluaciones/${evaluacionId}/exportar-pdf`, {
      responseType: 'blob', // Importante para archivos binarios
    });

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Obtener el nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'Estadisticas_Evaluacion.pdf';

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2) {
        fileName = fileNameMatch[1];
      }
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
  },

  // ==========================================
  // GESTIÓN DE IMÁGENES
  // ==========================================

  /**
   * Subir imagen a una pregunta
   */
  subirImagenPregunta: async (preguntaId, archivoImagen) => {
    const formData = new FormData();
    formData.append('imagen', archivoImagen);

    const response = await api.post(`/preguntas/${preguntaId}/imagen`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Obtener imágenes de una pregunta
   */
  obtenerImagenesPregunta: async (preguntaId) => {
    const response = await api.get(`/preguntas/${preguntaId}/imagenes`);
    return response.data;
  },

  /**
   * Eliminar imagen de una pregunta
   */
  eliminarImagenPregunta: async (imagenId) => {
    const response = await api.delete(`/preguntas/imagenes/${imagenId}`);
    return response.data;
  },

  /**
   * Subir imagen a una opción de pregunta
   */
  subirImagenOpcion: async (opcionId, archivoImagen) => {
    const formData = new FormData();
    formData.append('imagen', archivoImagen);

    const response = await api.post(`/preguntas/opciones/${opcionId}/imagen`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Obtener imágenes de una opción
   */
  obtenerImagenesOpcion: async (opcionId) => {
    const response = await api.get(`/preguntas/opciones/${opcionId}/imagenes`);
    return response.data;
  },

  /**
   * Eliminar imagen de una opción
   */
  eliminarImagenOpcion: async (imagenId) => {
    const response = await api.delete(`/preguntas/opciones/imagenes/${imagenId}`);
    return response.data;
  },

  /**
   * Obtener URL de imagen para visualización
   */
  obtenerUrlImagen: (nombreArchivo) => {
    return `${import.meta.env.VITE_API_URL}/uploads/evaluaciones/${nombreArchivo}`;
  },
};

export default evaluacionesService;
