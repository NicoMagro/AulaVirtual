import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, Edit, Trash2, CheckCircle, XCircle, FileQuestion, ArrowLeft, ClipboardCheck, BarChart3 } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';
import ModalCrearPregunta from './ModalCrearPregunta';
import IntentosCalificar from './IntentosCalificar';
import CalificarIntento from './CalificarIntento';
import EstadisticasEvaluacion from './EstadisticasEvaluacion';

const BancoPreguntas = ({ evaluacion, onVolver }) => {
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalCrearPregunta, setModalCrearPregunta] = useState(false);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);

  // Estados para navegación de calificación y estadísticas
  const [vistaActual, setVistaActual] = useState('banco'); // 'banco' | 'intentos' | 'calificar' | 'estadisticas'
  const [intentoSeleccionado, setIntentoSeleccionado] = useState(null);

  const cargarPreguntas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionesService.obtenerPreguntas(evaluacion.id);
      setPreguntas(response.data || []);
    } catch (err) {
      console.error('Error al cargar preguntas:', err);
      setError('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (evaluacion?.id) {
      cargarPreguntas();
    }
  }, [evaluacion?.id]);

  const handleCrearPregunta = () => {
    setPreguntaSeleccionada(null);
    setModalCrearPregunta(true);
  };

  const handleEditarPregunta = (pregunta) => {
    setPreguntaSeleccionada(pregunta);
    setModalCrearPregunta(true);
  };

  const handleEliminarPregunta = async (pregunta) => {
    if (!window.confirm(`¿Estás seguro de eliminar esta pregunta?`)) {
      return;
    }

    try {
      await evaluacionesService.eliminarPregunta(pregunta.id);
      await cargarPreguntas();
    } catch (err) {
      console.error('Error al eliminar pregunta:', err);
      alert('Error al eliminar la pregunta');
    }
  };

  // Manejadores de navegación para calificación
  const handleVerIntentos = () => {
    setVistaActual('intentos');
  };

  const handleVolverDesdeLista = () => {
    setVistaActual('banco');
    setIntentoSeleccionado(null);
  };

  const handleSeleccionarIntento = (intento) => {
    setIntentoSeleccionado(intento);
    setVistaActual('calificar');
  };

  const handleVolverDesdeCalificar = () => {
    setVistaActual('intentos');
    setIntentoSeleccionado(null);
  };

  const handlePublicarResultados = () => {
    // Volver a la lista de intentos después de publicar
    setVistaActual('intentos');
    setIntentoSeleccionado(null);
  };

  const handleVerEstadisticas = () => {
    setVistaActual('estadisticas');
  };

  const handleVolverDesdeEstadisticas = () => {
    setVistaActual('banco');
  };

  const obtenerIconoTipoPregunta = (tipo) => {
    switch (tipo) {
      case 'multiple_choice':
        return '📝';
      case 'verdadero_falso':
        return '✓/✗';
      case 'verdadero_falso_justificacion':
        return '✓/✗ + 📄';
      case 'desarrollo':
        return '📋';
      default:
        return '❓';
    }
  };

  const obtenerNombreTipoPregunta = (tipo) => {
    switch (tipo) {
      case 'multiple_choice':
        return 'Múltiple Choice';
      case 'verdadero_falso':
        return 'Verdadero/Falso';
      case 'verdadero_falso_justificacion':
        return 'V/F con Justificación';
      case 'desarrollo':
        return 'Desarrollo';
      default:
        return 'Desconocido';
    }
  };

  const calcularPuntajeTotal = () => {
    return preguntas.reduce((total, p) => total + parseFloat(p.puntaje || 0), 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Renderizar vista de calificación de intento individual
  if (vistaActual === 'calificar' && intentoSeleccionado) {
    return (
      <CalificarIntento
        intento={intentoSeleccionado}
        onVolver={handleVolverDesdeCalificar}
        onPublicar={handlePublicarResultados}
      />
    );
  }

  // Renderizar lista de intentos para calificar
  if (vistaActual === 'intentos') {
    return (
      <IntentosCalificar
        evaluacion={evaluacion}
        onVolver={handleVolverDesdeLista}
        onSeleccionarIntento={handleSeleccionarIntento}
      />
    );
  }

  // Renderizar vista de estadísticas
  if (vistaActual === 'estadisticas') {
    return (
      <EstadisticasEvaluacion
        evaluacion={evaluacion}
        onVolver={handleVolverDesdeEstadisticas}
      />
    );
  }

  // Vista principal: Banco de Preguntas
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Banco de Preguntas</h2>
            <p className="text-sm text-gray-600">{evaluacion.titulo}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerEstadisticas}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <BarChart3 size={20} />
            Estadísticas
          </button>

          <button
            onClick={handleVerIntentos}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <ClipboardCheck size={20} />
            Calificar Intentos
          </button>

          <button
            onClick={handleCrearPregunta}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Pregunta
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <FileQuestion size={20} />
            <div>
              <p className="text-sm font-medium">Total Preguntas</p>
              <p className="text-2xl font-bold">{preguntas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={20} />
            <div>
              <p className="text-sm font-medium">Puntaje Total</p>
              <p className="text-2xl font-bold">{calcularPuntajeTotal()}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <FileQuestion size={20} />
            <div>
              <p className="text-sm font-medium">Se Mostrarán</p>
              <p className="text-2xl font-bold">{evaluacion.cantidad_preguntas_mostrar}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Lista de preguntas */}
      {preguntas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileQuestion size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            No hay preguntas en el banco. Crea tu primera pregunta.
          </p>
          <button
            onClick={handleCrearPregunta}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Crear Primera Pregunta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {preguntas.map((pregunta, index) => (
            <div
              key={pregunta.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Contenido de la pregunta */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{obtenerIconoTipoPregunta(pregunta.tipo_pregunta)}</span>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {obtenerNombreTipoPregunta(pregunta.tipo_pregunta)}
                        </span>
                        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                          {pregunta.puntaje} puntos
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-3">{pregunta.enunciado}</p>

                      {/* Opciones para multiple choice */}
                      {pregunta.tipo_pregunta === 'multiple_choice' && pregunta.opciones && (
                        <div className="space-y-2 mt-3">
                          {pregunta.opciones.map((opcion, idx) => (
                            <div
                              key={opcion.id}
                              className={`flex items-center gap-2 text-sm p-2 rounded ${
                                opcion.es_correcta
                                  ? 'bg-green-50 text-green-800 border border-green-200'
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {opcion.es_correcta ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <XCircle size={16} className="text-gray-400" />
                              )}
                              <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                              <span>{opcion.texto}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Respuesta para verdadero/falso */}
                      {(pregunta.tipo_pregunta === 'verdadero_falso' ||
                        pregunta.tipo_pregunta === 'verdadero_falso_justificacion') && (
                        <div className="mt-3">
                          <div
                            className={`inline-flex items-center gap-2 text-sm px-3 py-1 rounded ${
                              pregunta.respuesta_correcta
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {pregunta.respuesta_correcta ? (
                              <CheckCircle size={16} />
                            ) : (
                              <XCircle size={16} />
                            )}
                            <span className="font-medium">
                              Respuesta correcta: {pregunta.respuesta_correcta ? 'Verdadero' : 'Falso'}
                            </span>
                          </div>
                          {pregunta.requiere_justificacion && (
                            <p className="text-xs text-gray-500 mt-2">
                              * Requiere justificación del estudiante
                            </p>
                          )}
                        </div>
                      )}

                      {/* Indicador para desarrollo */}
                      {pregunta.tipo_pregunta === 'desarrollo' && (
                        <p className="text-xs text-gray-500 mt-2">
                          * Los estudiantes responderán con texto libre
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleEditarPregunta(pregunta)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar pregunta"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => handleEliminarPregunta(pregunta)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar pregunta"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar pregunta */}
      {modalCrearPregunta && (
        <ModalCrearPregunta
          isOpen={modalCrearPregunta}
          onClose={() => {
            setModalCrearPregunta(false);
            setPreguntaSeleccionada(null);
          }}
          evaluacion_id={evaluacion.id}
          pregunta={preguntaSeleccionada}
          onSuccess={async () => {
            await cargarPreguntas();
            setModalCrearPregunta(false);
            setPreguntaSeleccionada(null);
          }}
        />
      )}
    </div>
  );
};

BancoPreguntas.propTypes = {
  evaluacion: PropTypes.object.isRequired,
  onVolver: PropTypes.func.isRequired,
};

export default BancoPreguntas;
