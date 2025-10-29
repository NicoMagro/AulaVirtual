import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, FileText, Calendar, Clock, Users, Edit, Trash2, Eye, CheckCircle, XCircle, Award } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';
import ModalCrearEvaluacion from './ModalCrearEvaluacion';
import BancoPreguntas from './BancoPreguntas';
import RealizarEvaluacion from './RealizarEvaluacion';
import MisNotasEvaluacion from './MisNotasEvaluacion';
import VerResultados from './VerResultados';

const EvaluacionesAula = ({ aula_id, esProfesor }) => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'banco_preguntas', 'realizar_evaluacion', 'mis_notas', 'ver_resultados'
  const [evaluacionActiva, setEvaluacionActiva] = useState(null);
  const [intentoSeleccionado, setIntentoSeleccionado] = useState(null);

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionesService.obtenerPorAula(aula_id);
      setEvaluaciones(response.data || []);
    } catch (err) {
      console.error('Error al cargar evaluaciones:', err);
      setError('Error al cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aula_id) {
      cargarEvaluaciones();
    }
  }, [aula_id]);

  const handleCrearEvaluacion = () => {
    setEvaluacionSeleccionada(null);
    setModalCrear(true);
  };

  const handleEditarEvaluacion = (evaluacion) => {
    setEvaluacionSeleccionada(evaluacion);
    setModalCrear(true);
  };

  const handleVerEvaluacion = (evaluacion) => {
    setEvaluacionActiva(evaluacion);
    // Profesores van al banco de preguntas, estudiantes a realizar evaluación
    setVistaActual(esProfesor ? 'banco_preguntas' : 'realizar_evaluacion');
  };

  const handleVolverALista = () => {
    setVistaActual('lista');
    setEvaluacionActiva(null);
    setIntentoSeleccionado(null);
  };

  const handleVerMisNotas = (evaluacion) => {
    setEvaluacionActiva(evaluacion);
    setVistaActual('mis_notas');
  };

  const handleVerResultados = (intento) => {
    setIntentoSeleccionado(intento);
    setVistaActual('ver_resultados');
  };

  const handleVolverDesdeMisNotas = () => {
    setVistaActual('lista');
    setEvaluacionActiva(null);
  };

  const handleVolverDesdeResultados = () => {
    setVistaActual('mis_notas');
    setIntentoSeleccionado(null);
  };

  const handleEliminarEvaluacion = async (evaluacion) => {
    if (!window.confirm(`¿Estás seguro de eliminar la evaluación "${evaluacion.titulo}"?`)) {
      return;
    }

    try {
      await evaluacionesService.eliminar(evaluacion.id);
      await cargarEvaluaciones();
    } catch (err) {
      console.error('Error al eliminar evaluación:', err);
      alert('Error al eliminar la evaluación');
    }
  };

  const handleCambiarEstado = async (evaluacion, nuevoEstado) => {
    try {
      await evaluacionesService.actualizar(evaluacion.id, { estado: nuevoEstado });
      await cargarEvaluaciones();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert('Error al cambiar el estado de la evaluación');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin definir';
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerEstadoBadge = (estado) => {
    const estados = {
      borrador: { color: 'bg-gray-100 text-gray-700', texto: 'Borrador' },
      publicado: { color: 'bg-green-100 text-green-700', texto: 'Publicado' },
      cerrado: { color: 'bg-red-100 text-red-700', texto: 'Cerrado' },
    };

    const estadoInfo = estados[estado] || estados.borrador;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
        {estadoInfo.texto}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Si estamos viendo el banco de preguntas, mostrar ese componente
  if (vistaActual === 'banco_preguntas' && evaluacionActiva) {
    return (
      <BancoPreguntas
        evaluacion={evaluacionActiva}
        onVolver={handleVolverALista}
      />
    );
  }

  // Si estamos realizando una evaluación, mostrar ese componente
  if (vistaActual === 'realizar_evaluacion' && evaluacionActiva) {
    return (
      <RealizarEvaluacion
        evaluacion={evaluacionActiva}
        onVolver={handleVolverALista}
      />
    );
  }

  // Si estamos viendo las notas del estudiante
  if (vistaActual === 'mis_notas' && evaluacionActiva) {
    return (
      <MisNotasEvaluacion
        evaluacion={evaluacionActiva}
        onVolver={handleVolverDesdeMisNotas}
        onVerResultados={handleVerResultados}
      />
    );
  }

  // Si estamos viendo los resultados detallados de un intento
  if (vistaActual === 'ver_resultados' && intentoSeleccionado && evaluacionActiva) {
    return (
      <VerResultados
        intento={intentoSeleccionado}
        evaluacion={evaluacionActiva}
        onVolver={handleVolverDesdeResultados}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText size={24} />
          Evaluaciones
        </h2>

        {esProfesor && (
          <button
            onClick={handleCrearEvaluacion}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Evaluación
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Lista de evaluaciones */}
      {evaluaciones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            {esProfesor
              ? 'No hay evaluaciones creadas. Crea tu primera evaluación.'
              : 'No hay evaluaciones disponibles en este aula.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {evaluaciones.map((evaluacion) => (
            <div
              key={evaluacion.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Información principal */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {evaluacion.titulo}
                      </h3>
                      {evaluacion.descripcion && (
                        <p className="text-gray-600 text-sm mb-2">{evaluacion.descripcion}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {obtenerEstadoBadge(evaluacion.estado)}
                        <span className="text-xs text-gray-500">
                          por {evaluacion.creado_por_nombre}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <div>
                        <p className="font-medium">Inicio</p>
                        <p className="text-xs">{formatearFecha(evaluacion.fecha_inicio)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <div>
                        <p className="font-medium">Fin</p>
                        <p className="text-xs">{formatearFecha(evaluacion.fecha_fin)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      <div>
                        <p className="font-medium">Duración</p>
                        <p className="text-xs">
                          {evaluacion.duracion_maxima_minutos
                            ? `${evaluacion.duracion_maxima_minutos} min`
                            : 'Sin límite'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={16} />
                      <div>
                        <p className="font-medium">Intentos</p>
                        <p className="text-xs">{evaluacion.intentos_permitidos}</p>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {evaluacion.total_preguntas_banco || 0} preguntas en banco
                    </span>
                    <span>
                      Muestra {evaluacion.cantidad_preguntas_mostrar} preguntas
                    </span>
                    <span>
                      Nota mínima: {evaluacion.nota_minima_aprobacion}
                    </span>
                    {evaluacion.orden_aleatorio && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Orden aleatorio
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleVerEvaluacion(evaluacion)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver evaluación"
                  >
                    <Eye size={18} />
                  </button>

                  {!esProfesor && (
                    <button
                      onClick={() => handleVerMisNotas(evaluacion)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Ver mis notas"
                    >
                      <Award size={18} />
                    </button>
                  )}

                  {esProfesor && (
                    <>
                      {evaluacion.estado === 'borrador' ? (
                        <button
                          onClick={() => handleCambiarEstado(evaluacion, 'publicado')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Publicar evaluación"
                        >
                          <CheckCircle size={18} />
                        </button>
                      ) : evaluacion.estado === 'publicado' ? (
                        <button
                          onClick={() => handleCambiarEstado(evaluacion, 'borrador')}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Pasar a borrador"
                        >
                          <XCircle size={18} />
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleEditarEvaluacion(evaluacion)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar evaluación"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => handleEliminarEvaluacion(evaluacion)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar evaluación"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar evaluación */}
      {modalCrear && (
        <ModalCrearEvaluacion
          isOpen={modalCrear}
          onClose={() => {
            setModalCrear(false);
            setEvaluacionSeleccionada(null);
          }}
          aula_id={aula_id}
          evaluacion={evaluacionSeleccionada}
          onSuccess={async () => {
            await cargarEvaluaciones();
            setModalCrear(false);
            setEvaluacionSeleccionada(null);
          }}
        />
      )}
    </div>
  );
};

EvaluacionesAula.propTypes = {
  aula_id: PropTypes.string.isRequired,
  esProfesor: PropTypes.bool.isRequired,
};

export default EvaluacionesAula;
