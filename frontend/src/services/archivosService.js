import api from './api';

const archivosService = {
  /**
   * Subir un archivo al aula
   * Solo profesores
   */
  subirArchivo: async (formData) => {
    // formData debe contener: archivo, aula_id, hoja_id, descripcion (opcional)
    const response = await api.post('/archivos/subir', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Obtener archivos de una hoja de un aula
   * Accesible por profesores y estudiantes matriculados
   */
  obtenerArchivosAula: async (aula_id, hoja_id = null) => {
    const params = hoja_id ? { hoja_id } : {};
    const response = await api.get(`/archivos/aula/${aula_id}`, { params });
    return response.data;
  },

  /**
   * Descargar un archivo
   * Accesible por profesores y estudiantes matriculados (solo si visible)
   */
  descargarArchivo: async (archivo_id, nombre_original) => {
    const response = await api.get(`/archivos/descargar/${archivo_id}`, {
      responseType: 'blob', // Importante para archivos
    });

    // Crear un enlace temporal para descargar
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombre_original);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
  },

  /**
   * Eliminar un archivo
   * Solo profesores asignados al aula
   */
  eliminarArchivo: async (archivo_id) => {
    const response = await api.delete(`/archivos/${archivo_id}`);
    return response.data;
  },

  /**
   * Cambiar visibilidad de un archivo (toggle visible/oculto)
   * Solo profesores asignados al aula
   */
  cambiarVisibilidadArchivo: async (archivo_id) => {
    const response = await api.put(`/archivos/${archivo_id}/visible`);
    return response.data;
  },
};

export default archivosService;
