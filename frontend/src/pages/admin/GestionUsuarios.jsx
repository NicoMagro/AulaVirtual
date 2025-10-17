import { useState, useEffect } from 'react';
import usuariosService from '../../services/usuariosService';
import { Users, Plus, X, AlertCircle, Shield } from 'lucide-react';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usuariosRes, rolesRes] = await Promise.all([
        usuariosService.obtenerTodos(),
        usuariosService.obtenerRoles(),
      ]);
      setUsuarios(usuariosRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAgregarRol = async (usuario_id, rol_id) => {
    try {
      setProcesando(true);
      await usuariosService.agregarRol(usuario_id, rol_id);
      await cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al agregar el rol');
      console.error(err);
    } finally {
      setProcesando(false);
    }
  };

  const handleQuitarRol = async (usuario_id, rol_id, usuario_nombre, rol_nombre) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas quitar el rol "${rol_nombre}" a ${usuario_nombre}?`
      )
    ) {
      return;
    }

    try {
      setProcesando(true);
      await usuariosService.quitarRol(usuario_id, rol_id);
      await cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al quitar el rol');
      console.error(err);
    } finally {
      setProcesando(false);
    }
  };

  const getRolColor = (rolNombre) => {
    switch (rolNombre) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'profesor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'estudiante':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRolesDisponibles = (usuarioRoles) => {
    const rolesActuales = usuarioRoles.map((r) => r.id);
    return roles.filter((r) => !rolesActuales.includes(r.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield size={32} />
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600 mt-1">Administra los roles de los usuarios del sistema</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    Usuario
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles Actuales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agregar Rol
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => {
                const rolesDisponibles = getRolesDisponibles(usuario.roles);
                return (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </div>
                      {!usuario.activo && (
                        <span className="text-xs text-red-600">(Inactivo)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{usuario.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {usuario.roles && usuario.roles.length > 0 ? (
                          usuario.roles.map((rol) => (
                            <span
                              key={rol.id}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getRolColor(
                                rol.nombre
                              )}`}
                            >
                              {rol.nombre}
                              {usuario.roles.length > 1 && (
                                <button
                                  onClick={() =>
                                    handleQuitarRol(
                                      usuario.id,
                                      rol.id,
                                      `${usuario.nombre} ${usuario.apellido}`,
                                      rol.nombre
                                    )
                                  }
                                  disabled={procesando}
                                  className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors disabled:opacity-50"
                                  title="Quitar rol"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">Sin roles asignados</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rolesDisponibles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {rolesDisponibles.map((rol) => (
                            <button
                              key={rol.id}
                              onClick={() => handleAgregarRol(usuario.id, rol.id)}
                              disabled={procesando}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                              title={`Agregar rol ${rol.nombre}`}
                            >
                              <Plus size={12} />
                              {rol.nombre}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Tiene todos los roles
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {usuarios.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 text-lg mt-2">No hay usuarios registrados</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Información sobre roles:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Admin:</strong> Acceso completo al sistema, puede gestionar aulas, usuarios y
            asignar profesores
          </li>
          <li>
            • <strong>Profesor:</strong> Puede gestionar sus aulas asignadas y ver estudiantes
            matriculados
          </li>
          <li>
            • <strong>Estudiante:</strong> Puede explorar aulas y matricularse en ellas
          </li>
          <li className="mt-2">
            • Los usuarios con múltiples roles pueden cambiar entre ellos desde el selector en el
            menú superior
          </li>
          <li>
            • Un usuario debe tener al menos un rol asignado en todo momento
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GestionUsuarios;
