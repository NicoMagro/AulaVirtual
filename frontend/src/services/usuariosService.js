import api from './api';

const usuariosService = {
  /**
   * Obtener todos los usuarios con sus roles
   */
  obtenerTodos: async () => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  /**
   * Obtener todos los roles disponibles
   */
  obtenerRoles: async () => {
    const response = await api.get('/usuarios/roles');
    return response.data;
  },

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

  /**
   * Agregar un rol a un usuario
   * @param {string} usuario_id - ID del usuario
   * @param {number} rol_id - ID del rol
   */
  agregarRol: async (usuario_id, rol_id) => {
    const response = await api.post('/usuarios/agregar-rol', {
      usuario_id,
      rol_id,
    });
    return response.data;
  },

  /**
   * Quitar un rol de un usuario
   * @param {string} usuario_id - ID del usuario
   * @param {number} rol_id - ID del rol
   */
  quitarRol: async (usuario_id, rol_id) => {
    const response = await api.delete(`/usuarios/${usuario_id}/roles/${rol_id}`);
    return response.data;
  },
};

export default usuariosService;
