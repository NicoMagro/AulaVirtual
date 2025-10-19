import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  MessageSquare,
  Plus,
  CheckCircle,
  Circle,
  Lock,
  Globe,
  Trash2,
  X,
  Send,
  AlertCircle,
  ChevronRight,
  User,
} from 'lucide-react';
import consultasService from '../../services/consultasService';

// Función para formatear fecha
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ConsultasAula = ({ aula_id, esProfesor, usuario }) => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // todas, publicas, privadas, resueltas, pendientes
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState(null);
  const [respuestas, setRespuestas] = useState([]);

  // Estado para crear consulta
  const [nuevaConsulta, setNuevaConsulta] = useState({
    titulo: '',
    pregunta: '',
    publica: true,
  });
  const [creando, setCreando] = useState(false);

  // Estado para responder
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');
  const [respondiendo, setRespondiendo] = useState(false);

  const cargarConsultas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await consultasService.obtenerConsultasAula(aula_id);
      setConsultas(response.data);
    } catch (err) {
      console.error('Error al cargar consultas:', err);
      setError('Error al cargar las consultas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aula_id) {
      cargarConsultas();
    }
  }, [aula_id]);

  const handleCrearConsulta = async (e) => {
    e.preventDefault();

    if (!nuevaConsulta.titulo.trim() || !nuevaConsulta.pregunta.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      setCreando(true);
      await consultasService.crearConsulta({
        aula_id,
        titulo: nuevaConsulta.titulo,
        pregunta: nuevaConsulta.pregunta,
        publica: nuevaConsulta.publica,
      });

      await cargarConsultas();
      setModalCrear(false);
      setNuevaConsulta({ titulo: '', pregunta: '', publica: true });
    } catch (err) {
      console.error('Error al crear consulta:', err);
      alert(err.response?.data?.message || 'Error al crear la consulta');
    } finally {
      setCreando(false);
    }
  };

  const handleAbrirDetalle = async (consulta) => {
    try {
      setConsultaSeleccionada(consulta);
      setModalDetalle(true);
      const response = await consultasService.obtenerConsultaDetalle(consulta.id);
      setRespuestas(response.data.respuestas);
    } catch (err) {
      console.error('Error al cargar detalle:', err);
      alert('Error al cargar el detalle de la consulta');
    }
  };

  const handleCrearRespuesta = async (e) => {
    e.preventDefault();

    if (!nuevaRespuesta.trim()) {
      alert('Por favor escribe una respuesta');
      return;
    }

    try {
      setRespondiendo(true);
      await consultasService.crearRespuesta(consultaSeleccionada.id, nuevaRespuesta);

      // Recargar respuestas
      const response = await consultasService.obtenerConsultaDetalle(consultaSeleccionada.id);
      setRespuestas(response.data.respuestas);
      setNuevaRespuesta('');

      // Recargar lista de consultas para actualizar el contador
      await cargarConsultas();
    } catch (err) {
      console.error('Error al crear respuesta:', err);
      alert(err.response?.data?.message || 'Error al crear la respuesta');
    } finally {
      setRespondiendo(false);
    }
  };

  const handleMarcarResuelta = async (consulta_id) => {
    try {
      await consultasService.marcarComoResuelta(consulta_id);
      await cargarConsultas();

      // Si estamos en el modal de detalle, actualizar
      if (modalDetalle && consultaSeleccionada?.id === consulta_id) {
        const response = await consultasService.obtenerConsultaDetalle(consulta_id);
        setConsultaSeleccionada(response.data.consulta);
      }
    } catch (err) {
      console.error('Error al marcar como resuelta:', err);
      alert('Error al actualizar el estado de la consulta');
    }
  };

  const handleEliminarConsulta = async (consulta_id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta consulta? Se eliminarán todas las respuestas también.')) {
      return;
    }

    try {
      await consultasService.eliminarConsulta(consulta_id);
      await cargarConsultas();

      if (modalDetalle) {
        setModalDetalle(false);
        setConsultaSeleccionada(null);
      }
    } catch (err) {
      console.error('Error al eliminar consulta:', err);
      alert('Error al eliminar la consulta');
    }
  };

  const handleEliminarRespuesta = async (respuesta_id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta respuesta?')) {
      return;
    }

    try {
      await consultasService.eliminarRespuesta(respuesta_id);

      // Recargar respuestas
      const response = await consultasService.obtenerConsultaDetalle(consultaSeleccionada.id);
      setRespuestas(response.data.respuestas);

      // Recargar lista de consultas para actualizar el contador
      await cargarConsultas();
    } catch (err) {
      console.error('Error al eliminar respuesta:', err);
      alert('Error al eliminar la respuesta');
    }
  };

  // Filtrar consultas
  const consultasFiltradas = consultas.filter((consulta) => {
    if (filtro === 'publicas') return consulta.publica;
    if (filtro === 'privadas') return !consulta.publica;
    if (filtro === 'resueltas') return consulta.resuelta;
    if (filtro === 'pendientes') return !consulta.resuelta;
    return true; // 'todas'
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare size={20} />
          Consultas
        </h3>
        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Nueva Consulta
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro('todas')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filtro === 'todas'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltro('publicas')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filtro === 'publicas'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Globe size={14} />
          Públicas
        </button>
        {esProfesor && (
          <button
            onClick={() => setFiltro('privadas')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filtro === 'privadas'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Lock size={14} />
            Privadas
          </button>
        )}
        <button
          onClick={() => setFiltro('resueltas')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filtro === 'resueltas'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CheckCircle size={14} />
          Resueltas
        </button>
        <button
          onClick={() => setFiltro('pendientes')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filtro === 'pendientes'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Circle size={14} />
          Pendientes
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Lista de consultas */}
      {consultasFiltradas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay consultas que coincidan con el filtro seleccionado
        </div>
      ) : (
        <div className="space-y-3">
          {consultasFiltradas.map((consulta) => (
            <div
              key={consulta.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                consulta.resuelta
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div
                className="flex items-start justify-between gap-4 cursor-pointer"
                onClick={() => handleAbrirDetalle(consulta)}
              >
                <div className="flex-1 min-w-0">
                  {/* Título y badges */}
                  <div className="flex items-start gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 flex-1">
                      {consulta.titulo}
                    </h4>
                    <div className="flex items-center gap-2">
                      {consulta.resuelta ? (
                        <CheckCircle size={18} className="text-green-600" title="Resuelta" />
                      ) : (
                        <Circle size={18} className="text-gray-400" title="Pendiente" />
                      )}
                      {consulta.publica ? (
                        <Globe size={16} className="text-blue-500" title="Pública" />
                      ) : (
                        <Lock size={16} className="text-orange-500" title="Privada" />
                      )}
                    </div>
                  </div>

                  {/* Pregunta (truncada) */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {consulta.pregunta}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {consulta.creado_por_nombre}
                    </span>
                    <span>•</span>
                    <span>{formatearFecha(consulta.fecha_creacion)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {consulta.cantidad_respuestas} respuesta{consulta.cantidad_respuestas !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
              </div>

              {/* Botón para marcar como resuelta (solo para el creador) */}
              {usuario?.id === consulta.creado_por && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarcarResuelta(consulta.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      consulta.resuelta
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {consulta.resuelta ? (
                      <>
                        <Circle size={14} />
                        Marcar como pendiente
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        Marcar como resuelta
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal crear consulta */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Nueva Consulta</h2>
              <button
                onClick={() => {
                  setModalCrear(false);
                  setNuevaConsulta({ titulo: '', pregunta: '', publica: true });
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCrearConsulta} className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={nuevaConsulta.titulo}
                  onChange={(e) => setNuevaConsulta({ ...nuevaConsulta, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Título breve de tu consulta..."
                  maxLength="255"
                  required
                />
              </div>

              {/* Pregunta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pregunta *
                </label>
                <textarea
                  value={nuevaConsulta.pregunta}
                  onChange={(e) => setNuevaConsulta({ ...nuevaConsulta, pregunta: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows="6"
                  placeholder="Describe tu consulta en detalle..."
                  required
                />
              </div>

              {/* Visibilidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibilidad
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={nuevaConsulta.publica === true}
                      onChange={() => setNuevaConsulta({ ...nuevaConsulta, publica: true })}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <Globe size={18} className="text-blue-500" />
                    <div>
                      <div className="font-medium text-sm">Pública</div>
                      <div className="text-xs text-gray-500">
                        Todos pueden ver y responder
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={nuevaConsulta.publica === false}
                      onChange={() => setNuevaConsulta({ ...nuevaConsulta, publica: false })}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    <Lock size={18} className="text-orange-500" />
                    <div>
                      <div className="font-medium text-sm">Privada</div>
                      <div className="text-xs text-gray-500">
                        Solo profesores pueden ver y responder
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalCrear(false);
                    setNuevaConsulta({ titulo: '', pregunta: '', publica: true });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={creando}
                >
                  {creando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Crear Consulta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle consulta */}
      {modalDetalle && consultaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {consultaSeleccionada.titulo}
                  </h2>
                  {consultaSeleccionada.publica ? (
                    <Globe size={18} className="text-blue-500" title="Pública" />
                  ) : (
                    <Lock size={18} className="text-orange-500" title="Privada" />
                  )}
                  {consultaSeleccionada.resuelta ? (
                    <CheckCircle size={18} className="text-green-600" title="Resuelta" />
                  ) : (
                    <Circle size={18} className="text-gray-400" title="Pendiente" />
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Por {consultaSeleccionada.creado_por_nombre} • {formatearFecha(consultaSeleccionada.fecha_creacion)}
                </div>
              </div>
              <button
                onClick={() => {
                  setModalDetalle(false);
                  setConsultaSeleccionada(null);
                  setRespuestas([]);
                  setNuevaRespuesta('');
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Pregunta original */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">{consultaSeleccionada.pregunta}</p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                {usuario?.id === consultaSeleccionada.creado_por && (
                  <button
                    onClick={() => handleMarcarResuelta(consultaSeleccionada.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      consultaSeleccionada.resuelta
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {consultaSeleccionada.resuelta ? (
                      <>
                        <Circle size={16} />
                        Marcar como pendiente
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Marcar como resuelta
                      </>
                    )}
                  </button>
                )}
                {(esProfesor || usuario?.id === consultaSeleccionada.creado_por) && (
                  <button
                    onClick={() => handleEliminarConsulta(consultaSeleccionada.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 size={16} />
                    Eliminar consulta
                  </button>
                )}
              </div>

              {/* Respuestas */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Respuestas ({respuestas.length})
                </h3>
                {respuestas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Aún no hay respuestas. ¡Sé el primero en responder!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {respuestas.map((respuesta) => (
                      <div
                        key={respuesta.id}
                        className="bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User size={16} className="text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {respuesta.respondido_por_nombre}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">
                              {formatearFecha(respuesta.fecha_creacion)}
                            </span>
                          </div>
                          {(esProfesor || usuario?.id === respuesta.respondido_por) && (
                            <button
                              onClick={() => handleEliminarRespuesta(respuesta.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar respuesta"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">{respuesta.respuesta}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Formulario de respuesta */}
            {(consultaSeleccionada.publica || esProfesor) && (
              <div className="border-t p-6">
                <form onSubmit={handleCrearRespuesta} className="space-y-3">
                  <textarea
                    value={nuevaRespuesta}
                    onChange={(e) => setNuevaRespuesta(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows="3"
                    placeholder="Escribe tu respuesta..."
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={respondiendo}
                    >
                      {respondiendo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Enviar respuesta
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

ConsultasAula.propTypes = {
  aula_id: PropTypes.string.isRequired,
  esProfesor: PropTypes.bool.isRequired,
  usuario: PropTypes.object.isRequired,
};

export default ConsultasAula;
