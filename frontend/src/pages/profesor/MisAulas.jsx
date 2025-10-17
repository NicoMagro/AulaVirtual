import { useState, useEffect } from 'react';
import aulasService from '../../services/aulasService';
import { Users, Key, Lock, Unlock, AlertCircle } from 'lucide-react';
import ModalGestionarClave from '../../components/profesor/ModalGestionarClave';
import ModalVerEstudiantes from '../../components/profesor/ModalVerEstudiantes';

const MisAulas = () => {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalClave, setModalClave] = useState(false);
  const [modalEstudiantes, setModalEstudiantes] = useState(false);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);

  const cargarAulas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aulasService.misAulasProfesor();
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

  const handleGestionarClave = (aula) => {
    setAulaSeleccionada(aula);
    setModalClave(true);
  };

  const handleVerEstudiantes = (aula) => {
    setAulaSeleccionada(aula);
    setModalEstudiantes(true);
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
        <h1 className="text-3xl font-bold text-gray-900">Mis Aulas</h1>
        <p className="text-gray-600 mt-1">Aulas donde estás asignado como profesor</p>
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
              <div>
                <h3 className="text-xl font-bold text-gray-900">{aula.nombre}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {aula.requiere_clave ? (
                    <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      <Lock size={12} />
                      Privada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <Unlock size={12} />
                      Pública
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {aula.descripcion || 'Sin descripción'}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estudiantes:</span>
                <span className="font-medium text-gray-900">
                  {aula.total_estudiantes || 0} / {aula.capacidad_maxima}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((aula.total_estudiantes || 0) / aula.capacidad_maxima) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleVerEstudiantes(aula)}
                className="w-full flex items-center justify-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Users size={16} />
                Ver Estudiantes
              </button>
              <button
                onClick={() => handleGestionarClave(aula)}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Key size={16} />
                Gestionar Clave
              </button>
            </div>
          </div>
        ))}
      </div>

      {aulas.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No estás asignado a ningún aula</p>
          <p className="text-gray-400 text-sm mt-2">
            Contacta con el administrador para que te asigne a un aula
          </p>
        </div>
      )}

      {/* Modales */}
      {modalClave && aulaSeleccionada && (
        <ModalGestionarClave
          isOpen={modalClave}
          onClose={() => {
            setModalClave(false);
            setAulaSeleccionada(null);
          }}
          aula={aulaSeleccionada}
          onSuccess={cargarAulas}
        />
      )}

      {modalEstudiantes && aulaSeleccionada && (
        <ModalVerEstudiantes
          isOpen={modalEstudiantes}
          onClose={() => {
            setModalEstudiantes(false);
            setAulaSeleccionada(null);
          }}
          aula={aulaSeleccionada}
        />
      )}
    </div>
  );
};

export default MisAulas;
