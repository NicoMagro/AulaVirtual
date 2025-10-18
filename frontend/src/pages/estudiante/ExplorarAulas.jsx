import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import matriculacionService from '../../services/matriculacionService';
import { Search, Lock, Unlock, Users, Check, AlertCircle, Eye } from 'lucide-react';
import ModalMatricularse from '../../components/estudiante/ModalMatricularse';

const ExplorarAulas = () => {
  const navigate = useNavigate();
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [modalMatricularse, setModalMatricularse] = useState(false);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);

  const cargarAulas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await matriculacionService.listarAulasDisponibles();
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

  const handleMatricularse = (aula) => {
    setAulaSeleccionada(aula);
    setModalMatricularse(true);
  };

  const aulasFiltradas = aulas.filter((aula) =>
    aula.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Explorar Aulas</h1>
        <p className="text-gray-600 mt-1">Encuentra y únete a aulas disponibles</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar aulas por nombre..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aulasFiltradas.map((aula) => (
          <div
            key={aula.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{aula.nombre}</h3>
                <div className="flex items-center gap-2">
                  {aula.requiere_clave ? (
                    <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      <Lock size={12} />
                      Requiere clave
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <Unlock size={12} />
                      Pública
                    </span>
                  )}
                  {aula.esta_matriculado && (
                    <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      <Check size={12} />
                      Matriculado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {aula.descripcion || 'Sin descripción'}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Users size={14} />
                  Estudiantes:
                </span>
                <span className="font-medium text-gray-900">
                  {aula.estudiantes_actuales || 0} / {aula.capacidad_maxima}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((aula.estudiantes_actuales || 0) / aula.capacidad_maxima) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {aula.esta_matriculado ? (
              <button
                onClick={() => navigate(`/aula/${aula.id}`)}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Eye size={16} />
                Entrar al Aula
              </button>
            ) : aula.estudiantes_actuales >= aula.capacidad_maxima ? (
              <button
                disabled
                className="w-full bg-gray-100 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed text-sm font-medium"
              >
                Aula llena
              </button>
            ) : (
              <button
                onClick={() => handleMatricularse(aula)}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                Matricularse
              </button>
            )}
          </div>
        ))}
      </div>

      {aulasFiltradas.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {busqueda ? 'No se encontraron aulas' : 'No hay aulas disponibles'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {busqueda ? 'Intenta con otro término de búsqueda' : 'Vuelve más tarde'}
          </p>
        </div>
      )}

      {/* Modal */}
      {modalMatricularse && aulaSeleccionada && (
        <ModalMatricularse
          isOpen={modalMatricularse}
          onClose={() => {
            setModalMatricularse(false);
            setAulaSeleccionada(null);
          }}
          aula={aulaSeleccionada}
          onSuccess={cargarAulas}
        />
      )}
    </div>
  );
};

export default ExplorarAulas;
