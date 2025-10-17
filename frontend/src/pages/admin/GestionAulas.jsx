import { useState, useEffect } from 'react';
import aulasService from '../../services/aulasService';
import { PlusCircle, Edit2, Trash2, Users, AlertCircle } from 'lucide-react';
import ModalCrearAula from '../../components/admin/ModalCrearAula';
import ModalEditarAula from '../../components/admin/ModalEditarAula';
import ModalAsignarProfesor from '../../components/admin/ModalAsignarProfesor';

const GestionAulas = () => {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalAsignarProfesor, setModalAsignarProfesor] = useState(false);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);

  const cargarAulas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aulasService.listarAulas(true);
      setAulas(response.data);
    } catch (err) {
      setError('Error al cargar las aulas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAulas();
  }, []);

  const handleEliminarAula = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de desactivar el aula "${nombre}"?`)) {
      return;
    }

    try {
      await aulasService.eliminarAula(id);
      cargarAulas();
    } catch (err) {
      alert('Error al eliminar el aula');
      console.error(err);
    }
  };

  const handleEditarAula = (aula) => {
    setAulaSeleccionada(aula);
    setModalEditar(true);
  };

  const handleAsignarProfesor = (aula) => {
    setAulaSeleccionada(aula);
    setModalAsignarProfesor(true);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Aulas</h1>
          <p className="text-gray-600 mt-1">Administra las aulas del sistema</p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={20} />
          Crear Aula
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aulas.map((aula) => (
          <div
            key={aula.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{aula.nombre}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditarAula(aula)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleEliminarAula(aula.id, aula.nombre)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {aula.descripcion || 'Sin descripción'}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Capacidad:</span>
                <span className="font-medium text-gray-900">
                  {aula.total_estudiantes || 0} / {aula.capacidad_maxima}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profesores:</span>
                <span className="font-medium text-gray-900">{aula.total_profesores || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Acceso:</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    aula.requiere_clave
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {aula.requiere_clave ? 'Con clave' : 'Pública'}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleAsignarProfesor(aula)}
              className="w-full flex items-center justify-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Users size={16} />
              Asignar Profesores
            </button>
          </div>
        ))}
      </div>

      {aulas.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay aulas creadas</p>
          <p className="text-gray-400 text-sm mt-2">Crea tu primera aula para comenzar</p>
        </div>
      )}

      {/* Modales */}
      {modalCrear && (
        <ModalCrearAula
          isOpen={modalCrear}
          onClose={() => setModalCrear(false)}
          onSuccess={cargarAulas}
        />
      )}

      {modalEditar && aulaSeleccionada && (
        <ModalEditarAula
          isOpen={modalEditar}
          onClose={() => {
            setModalEditar(false);
            setAulaSeleccionada(null);
          }}
          aula={aulaSeleccionada}
          onSuccess={cargarAulas}
        />
      )}

      {modalAsignarProfesor && aulaSeleccionada && (
        <ModalAsignarProfesor
          isOpen={modalAsignarProfesor}
          onClose={() => {
            setModalAsignarProfesor(false);
            setAulaSeleccionada(null);
          }}
          aula={aulaSeleccionada}
          onSuccess={cargarAulas}
        />
      )}
    </div>
  );
};

export default GestionAulas;
