import api from './api';

const usuariosService = {
  /**
   * Buscar usuarios por rol
   * @param {string} rol - Rol a buscar ('admin', 'profesor', 'estudiante')
   * @param {string} busqueda - Término de búsqueda (opcional)
   */
  buscarPorRol: async (rol, busqueda = '') => {
    const response = await api.get('/usuarios/por-rol', {
      params: {
        rol,
        busqueda,
      },
    });
    return response.data;
  },
};

export default usuariosService;
