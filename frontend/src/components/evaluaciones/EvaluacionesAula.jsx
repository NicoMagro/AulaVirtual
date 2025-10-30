import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, FileText, Calendar, Clock, Users, Edit, Trash2, Eye, CheckCircle, XCircle, Award, MoreVertical, PlayCircle, Target, ClipboardCheck, BarChart3 } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';
import ModalCrearEvaluacion from './ModalCrearEvaluacion';
import BancoPreguntas from './BancoPreguntas';
import RealizarEvaluacion from './RealizarEvaluacion';
import MisNotasEvaluacion from './MisNotasEvaluacion';
import VerResultados from './VerResultados';
import EstadisticasEvaluacion from './EstadisticasEvaluacion';
import IntentosCalificar from './IntentosCalificar';
import CalificarIntento from './CalificarIntento';

const EvaluacionesAula = ({ aula_id, esProfesor }) => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'banco_preguntas', 'realizar_evaluacion', 'mis_notas', 'ver_resultados'
  const [evaluacionActiva, setEvaluacionActiva] = useState(null);
  const [intentoSeleccionado, setIntentoSeleccionado] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null); // ID de la evaluación con menú abierto

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

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAbierto && !event.target.closest('.relative')) {
        setMenuAbierto(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuAbierto]);

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

  const handleVerEstadisticas = (evaluacion) => {
    setEvaluacionActiva(evaluacion);
    setVistaActual('estadisticas');
  };

  const handleVerIntentos = (evaluacion) => {
    setEvaluacionActiva(evaluacion);
    setVistaActual('intentos');
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

  const obtenerEstadoEstudiante = (evaluacion) => {
    const ahora = new Date();
    const inicio = evaluacion.fecha_inicio ? new Date(evaluacion.fecha_inicio) : null;
    const fin = evaluacion.fecha_fin ? new Date(evaluacion.fecha_fin) : null;
    const intentosRealizados = parseInt(evaluacion.intentos_realizados || 0);
    const intentosPermitidos = parseInt(evaluacion.intentos_permitidos || 1);

    if (evaluacion.estado !== 'publicado') {
      return { texto: 'No disponible', color: 'bg-gray-100 text-gray-700', puedeRealizar: false };
    }

    // Verificar si ya usó todos los intentos
    if (intentosRealizados >= intentosPermitidos) {
      return { texto: 'Sin intentos disponibles', color: 'bg-gray-100 text-gray-700', puedeRealizar: false };
    }

    if (inicio && ahora < inicio) {
      return { texto: 'Próximamente', color: 'bg-blue-100 text-blue-700', puedeRealizar: false };
    }

    if (fin && ahora > fin) {
      return { texto: 'Finalizada', color: 'bg-red-100 text-red-700', puedeRealizar: false };
    }

    return { texto: 'Disponible', color: 'bg-green-100 text-green-700', puedeRealizar: true };
  };

  const toggleMenu = (evaluacionId) => {
    setMenuAbierto(menuAbierto === evaluacionId ? null : evaluacionId);
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

  // Si estamos viendo estadísticas
  if (vistaActual === 'estadisticas' && evaluacionActiva) {
    return (
      <EstadisticasEvaluacion
        evaluacion={evaluacionActiva}
        onVolver={handleVolverALista}
      />
    );
  }

  // Si estamos viendo intentos para calificar (sin seleccionar uno específico)
  if (vistaActual === 'intentos' && evaluacionActiva) {
    return (
      <IntentosCalificar
        evaluacion={evaluacionActiva}
        onVolver={handleVolverALista}
        onSeleccionarIntento={(intento) => {
          setIntentoSeleccionado(intento);
          setVistaActual('calificar');
        }}
      />
    );
  }

  // Si estamos calificando un intento específico
  if (vistaActual === 'calificar' && intentoSeleccionado && evaluacionActiva) {
    return (
      <CalificarIntento
        intento={intentoSeleccionado}
        onVolver={() => {
          setVistaActual('intentos');
          setIntentoSeleccionado(null);
        }}
        onPublicar={() => {
          setVistaActual('intentos');
          setIntentoSeleccionado(null);
        }}
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
          {evaluaciones.map((evaluacion) => {
            const estadoEstudiante = !esProfesor ? obtenerEstadoEstudiante(evaluacion) : null;

            return (
              <div
                key={evaluacion.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* VISTA PARA PROFESORES */}
                {esProfesor ? (
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

                      {/* Información adicional para profesores */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          {evaluacion.total_preguntas_banco || 0} preguntas en banco
                        </span>
                        <span className="flex items-center gap-1">
                          <Target size={12} />
                          Muestra {evaluacion.cantidad_preguntas_mostrar}
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

                    {/* Menú desplegable para profesores */}
                    <div className="relative ml-4">
                      <button
                        onClick={() => toggleMenu(evaluacion.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {/* Dropdown menu */}
                      {menuAbierto === evaluacion.id && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={() => {
                              handleVerEvaluacion(evaluacion);
                              setMenuAbierto(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye size={16} />
                            Gestionar Preguntas
                          </button>

                          <button
                            onClick={() => {
                              handleVerIntentos(evaluacion);
                              setMenuAbierto(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <ClipboardCheck size={16} />
                            Calificar Intentos
                          </button>

                          <button
                            onClick={() => {
                              handleVerEstadisticas(evaluacion);
                              setMenuAbierto(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <BarChart3 size={16} />
                            Ver Estadísticas
                          </button>

                          <hr className="my-1" />

                          {evaluacion.estado === 'borrador' ? (
                            <button
                              onClick={() => {
                                handleCambiarEstado(evaluacion, 'publicado');
                                setMenuAbierto(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle size={16} />
                              Publicar Evaluación
                            </button>
                          ) : evaluacion.estado === 'publicado' ? (
                            <button
                              onClick={() => {
                                handleCambiarEstado(evaluacion, 'borrador');
                                setMenuAbierto(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                            >
                              <XCircle size={16} />
                              Pasar a Borrador
                            </button>
                          ) : null}

                          <button
                            onClick={() => {
                              handleEditarEvaluacion(evaluacion);
                              setMenuAbierto(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit size={16} />
                            Editar Evaluación
                          </button>

                          <hr className="my-1" />

                          <button
                            onClick={() => {
                              handleEliminarEvaluacion(evaluacion);
                              setMenuAbierto(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Eliminar Evaluación
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* VISTA PARA ESTUDIANTES */
                  <div className="space-y-4">
                    {/* Encabezado */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {evaluacion.titulo}
                        </h3>
                        {evaluacion.descripcion && (
                          <p className="text-gray-600 text-sm mb-2">{evaluacion.descripcion}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoEstudiante.color}`}>
                            {estadoEstudiante.texto}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Información relevante para estudiantes */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <div>
                          <p className="font-medium">Disponible hasta</p>
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
                          <p className="text-xs">
                            {evaluacion.intentos_realizados || 0} / {evaluacion.intentos_permitidos}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información de nota mínima */}
                    <div className="flex items-center gap-2 text-sm">
                      <Target size={16} className="text-gray-500" />
                      <span className="text-gray-600">
                        Nota mínima para aprobar: <span className="font-semibold text-gray-900">{evaluacion.nota_minima_aprobacion}</span>
                      </span>
                    </div>

                    {/* Botones de acción para estudiantes */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleVerEvaluacion(evaluacion)}
                        disabled={!estadoEstudiante.puedeRealizar}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        <PlayCircle size={20} />
                        {estadoEstudiante.puedeRealizar ? 'Realizar Evaluación' : estadoEstudiante.texto}
                      </button>

                      <button
                        onClick={() => handleVerMisNotas(evaluacion)}
                        className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        <Award size={20} />
                        Mis Notas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
