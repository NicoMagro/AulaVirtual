import { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, AlertCircle } from 'lucide-react';
import matriculacionService from '../../services/matriculacionService';

const ModalVerEstudiantes = ({ isOpen, onClose, aula }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (aula && isOpen) {
      cargarEstudiantes();
    }
  }, [aula, isOpen]);

  const cargarEstudiantes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await matriculacionService.obtenerEstudiantesAula(aula.id);
      setEstudiantes(response.data);
    } catch (err) {
      setError('Error al cargar los estudiantes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Estudiantes del Aula</h2>
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Total de estudiantes:{' '}
                <span className="font-semibold text-gray-900">{estudiantes.length}</span> /{' '}
                {aula?.capacidad_maxima}
              </p>
            </div>

            {estudiantes.length > 0 ? (
              <div className="space-y-3">
                {estudiantes.map((estudiante) => (
                  <div
                    key={estudiante.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={18} className="text-gray-600" />
                          <h3 className="font-semibold text-gray-900">
                            {estudiante.nombre} {estudiante.apellido}
                          </h3>
                          {estudiante.activo && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Activo
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} />
                            {estudiante.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} />
                            Matriculado: {formatearFecha(estudiante.fecha_matriculacion)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay estudiantes matriculados</p>
                <p className="text-gray-400 text-sm mt-2">
                  Los estudiantes pueden unirse desde la sección de aulas disponibles
                </p>
              </div>
            )}
          </>
        )}

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

export default ModalVerEstudiantes;
