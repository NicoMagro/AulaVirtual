import { useState, useEffect, useRef } from 'react';
import { X, UserPlus, UserMinus, Search } from 'lucide-react';
import aulasService from '../../services/aulasService';
import usuariosService from '../../services/usuariosService';

const ModalAsignarProfesor = ({ isOpen, onClose, aula, onSuccess }) => {
  const [busqueda, setBusqueda] = useState('');
  const [profesores, setProfesores] = useState([]);
  const [profesoresAsignados, setProfesoresAsignados] = useState([]);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (aula && isOpen) {
      cargarDetallesAula();
    }
  }, [aula, isOpen]);

  useEffect(() => {
    // Buscar profesores cuando el usuario escribe
    const timer = setTimeout(() => {
      if (busqueda.trim().length >= 2) {
        buscarProfesores();
      } else {
        setProfesores([]);
        setMostrarDropdown(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarDetallesAula = async () => {
    try {
      const response = await aulasService.obtenerAula(aula.id);
      setProfesoresAsignados(response.data.profesores || []);
    } catch (err) {
      console.error('Error al cargar profesores:', err);
    }
  };

  const buscarProfesores = async () => {
    setLoadingBusqueda(true);
    try {
      const response = await usuariosService.buscarPorRol('profesor', busqueda);
      setProfesores(response.data);
      setMostrarDropdown(true);
    } catch (err) {
      console.error('Error al buscar profesores:', err);
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const handleSeleccionarProfesor = (profesor) => {
    setProfesorSeleccionado(profesor);
    setBusqueda(`${profesor.nombre} ${profesor.apellido}`);
    setMostrarDropdown(false);
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!profesorSeleccionado) {
      setError('Selecciona un profesor de la lista');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await aulasService.asignarProfesor(aula.id, profesorSeleccionado.id);
      await cargarDetallesAula();
      setBusqueda('');
      setProfesorSeleccionado(null);
      setProfesores([]);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al asignar profesor');
    } finally {
      setLoading(false);
    }
  };

  const handleDesasignar = async (profesorId) => {
    if (!window.confirm('¿Estás seguro de desasignar este profesor?')) {
      return;
    }

    try {
      await aulasService.desasignarProfesor(aula.id, profesorId);
      await cargarDetallesAula();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al desasignar profesor');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestionar Profesores</h2>
            <p className="text-sm text-gray-600 mt-1">{aula?.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Formulario para asignar profesor con autocomplete */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Asignar Nuevo Profesor</h3>
          <form onSubmit={handleAsignar}>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setProfesorSeleccionado(null);
                  }}
                  placeholder="Buscar profesor por nombre..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                {loadingBusqueda && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                  </div>
                )}
              </div>

              {/* Dropdown de resultados */}
              {mostrarDropdown && profesores.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {profesores.map((profesor) => (
                    <button
                      key={profesor.id}
                      type="button"
                      onClick={() => handleSeleccionarProfesor(profesor)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">
                        {profesor.nombre} {profesor.apellido}
                      </p>
                      <p className="text-sm text-gray-600">{profesor.email}</p>
                    </button>
                  ))}
                </div>
              )}

              {mostrarDropdown && busqueda.length >= 2 && profesores.length === 0 && !loadingBusqueda && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                  <p className="text-gray-500 text-center">No se encontraron profesores</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !profesorSeleccionado}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={18} />
              {loading ? 'Asignando...' : 'Asignar Profesor'}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Escribe al menos 2 caracteres para buscar profesores disponibles
          </p>
        </div>

        {/* Lista de profesores asignados */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Profesores Asignados ({profesoresAsignados.length})
          </h3>
          {profesoresAsignados.length > 0 ? (
            <div className="space-y-2">
              {profesoresAsignados.map((profesor) => (
                <div
                  key={profesor.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {profesor.nombre} {profesor.apellido}
                    </p>
                    <p className="text-sm text-gray-600">{profesor.email}</p>
                  </div>
                  <button
                    onClick={() => handleDesasignar(profesor.id)}
                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <UserMinus size={18} />
                    Desasignar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No hay profesores asignados a esta aula
            </p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsignarProfesor;
