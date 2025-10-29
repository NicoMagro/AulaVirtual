import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, User, CheckCircle, XCircle, Send, AlertCircle } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';

const CalificarIntento = ({ intento: intentoInicial, onVolver, onPublicar }) => {
  const [intento, setIntento] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarIntentoCompleto();
  }, [intentoInicial.id]);

  const cargarIntentoCompleto = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionesService.obtenerIntentoParaCalificar(intentoInicial.id);
      setIntento(response.data.intento);
      setPreguntas(response.data.preguntas);

      // Cargar calificaciones existentes
      const calificacionesExistentes = {};
      response.data.preguntas.forEach((pregunta) => {
        if (pregunta.respuesta_estudiante) {
          calificacionesExistentes[pregunta.respuesta_estudiante.id] = {
            puntaje_obtenido: pregunta.respuesta_estudiante.puntaje_obtenido || 0,
            retroalimentacion: pregunta.respuesta_estudiante.retroalimentacion || '',
          };
        }
      });
      setCalificaciones(calificacionesExistentes);
    } catch (err) {
      console.error('Error al cargar intento:', err);
      setError('Error al cargar el intento');
    } finally {
      setLoading(false);
    }
  };

  const handleCalificacionChange = (respuestaId, campo, valor) => {
    setCalificaciones((prev) => ({
      ...prev,
      [respuestaId]: {
        ...prev[respuestaId],
        [campo]: valor,
      },
    }));
  };

  const handleGuardarCalificacion = async (respuestaId) => {
    try {
      setGuardando(true);
      const datos = calificaciones[respuestaId];
      await evaluacionesService.calificarRespuesta(intento.id, respuestaId, datos);
      alert('Calificación guardada exitosamente');
      await cargarIntentoCompleto(); // Recargar para actualizar puntajes
    } catch (err) {
      console.error('Error al guardar calificación:', err);
      alert(err.response?.data?.message || 'Error al guardar la calificación');
    } finally {
      setGuardando(false);
    }
  };

  const handlePublicarResultados = async () => {
    // Verificar que todas las preguntas manuales estén calificadas
    const preguntasSinCalificar = preguntas.filter(
      (p) =>
        (p.tipo_pregunta === 'desarrollo' || p.tipo_pregunta === 'verdadero_falso_justificacion') &&
        p.respuesta_estudiante &&
        (p.respuesta_estudiante.puntaje_obtenido === null || p.respuesta_estudiante.puntaje_obtenido === undefined)
    );

    if (preguntasSinCalificar.length > 0) {
      alert('Debes calificar todas las preguntas antes de publicar los resultados');
      return;
    }

    if (
      !window.confirm(
        '¿Estás seguro de publicar los resultados? El estudiante podrá ver su nota y retroalimentación.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await evaluacionesService.publicarResultados(intento.id);
      alert('Resultados publicados exitosamente');
      onPublicar();
    } catch (err) {
      console.error('Error al publicar resultados:', err);
      alert(err.response?.data?.message || 'Error al publicar los resultados');
      setLoading(false);
    }
  };

  const renderRespuestaEstudiante = (pregunta) => {
    const respuesta = pregunta.respuesta_estudiante;

    if (!respuesta) {
      return <p className="text-gray-500 italic">Sin respuesta</p>;
    }

    if (pregunta.tipo_pregunta === 'multiple_choice') {
      const opcionSeleccionada = pregunta.opciones?.find((o) => o.id === respuesta.opcion_seleccionada_id);
      return (
        <div>
          <p className="font-medium mb-2">Respuesta seleccionada:</p>
          <div className={`p-3 rounded-lg border-2 ${
            respuesta.es_correcta
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {respuesta.es_correcta ? (
                <CheckCircle size={18} className="text-green-600" />
              ) : (
                <XCircle size={18} className="text-red-600" />
              )}
              <span>{opcionSeleccionada?.texto || 'Opción no encontrada'}</span>
            </div>
          </div>
          {!respuesta.es_correcta && (
            <div className="mt-2">
              <p className="font-medium text-sm">Respuesta(s) correcta(s):</p>
              {pregunta.opciones
                ?.filter((o) => o.es_correcta)
                .map((o) => (
                  <p key={o.id} className="text-sm text-green-700">
                    • {o.texto}
                  </p>
                ))}
            </div>
          )}
        </div>
      );
    }

    if (pregunta.tipo_pregunta === 'verdadero_falso' || pregunta.tipo_pregunta === 'verdadero_falso_justificacion') {
      return (
        <div className="space-y-3">
          <div>
            <p className="font-medium mb-2">Respuesta:</p>
            <div className={`p-3 rounded-lg border-2 flex items-center gap-2 ${
              respuesta.respuesta_booleana === pregunta.respuesta_correcta
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              {respuesta.respuesta_booleana === pregunta.respuesta_correcta ? (
                <CheckCircle size={18} className="text-green-600" />
              ) : (
                <XCircle size={18} className="text-red-600" />
              )}
              <span className="font-medium">
                {respuesta.respuesta_booleana ? 'Verdadero' : 'Falso'}
              </span>
            </div>
            {respuesta.respuesta_booleana !== pregunta.respuesta_correcta && (
              <p className="mt-2 text-sm text-green-700">
                Respuesta correcta: {pregunta.respuesta_correcta ? 'Verdadero' : 'Falso'}
              </p>
            )}
          </div>

          {pregunta.tipo_pregunta === 'verdadero_falso_justificacion' && respuesta.justificacion && (
            <div>
              <p className="font-medium mb-2">Justificación:</p>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{respuesta.justificacion}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (pregunta.tipo_pregunta === 'desarrollo') {
      return (
        <div>
          <p className="font-medium mb-2">Respuesta:</p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap">{respuesta.respuesta_texto || 'Sin respuesta'}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const requiereCalificacionManual = (pregunta) => {
    return pregunta.tipo_pregunta === 'desarrollo' || pregunta.tipo_pregunta === 'verdadero_falso_justificacion';
  };

  if (loading && !intento) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={onVolver} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Volver
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="sticky top-0 bg-white border-b border-gray-200 pb-4 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onVolver} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Calificar Intento</h2>
            <div className="flex items-center gap-2 mt-1">
              <User size={16} className="text-gray-500" />
              <p className="text-sm text-gray-600">
                {intento?.estudiante_nombre} - Intento #{intento?.numero_intento}
              </p>
            </div>
          </div>

          {intento?.estado === 'entregado' && (
            <button
              onClick={handlePublicarResultados}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={18} />
              Publicar Resultados
            </button>
          )}
        </div>

        {/* Resumen de puntaje */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Puntaje Obtenido</p>
              <p className="text-2xl font-bold text-primary-600">
                {intento?.puntaje_obtenido || 0} / {intento?.puntaje_total}
              </p>
            </div>
            {intento?.nota_obtenida !== null && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Nota Final</p>
                <p className="text-2xl font-bold text-primary-600">
                  {parseFloat(intento?.nota_obtenida).toFixed(2)} / 10
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preguntas y respuestas */}
      <div className="space-y-6">
        {preguntas.map((pregunta, index) => (
          <div key={pregunta.id} className="bg-white border border-gray-200 rounded-lg p-6">
            {/* Encabezado de pregunta */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
              <div className="flex-1">
                <p className="text-gray-900 font-medium mb-2">{pregunta.enunciado}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {pregunta.puntaje} {pregunta.puntaje === 1 ? 'punto' : 'puntos'}
                  </span>
                  {pregunta.respuesta_estudiante?.puntaje_obtenido !== null && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-medium">
                      Obtuvo: {pregunta.respuesta_estudiante.puntaje_obtenido}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Respuesta del estudiante */}
            <div className="mb-4">{renderRespuestaEstudiante(pregunta)}</div>

            {/* Formulario de calificación para preguntas manuales */}
            {requiereCalificacionManual(pregunta) && pregunta.respuesta_estudiante && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle size={18} className="text-yellow-600" />
                  Calificación Manual
                </h4>

                <div className="space-y-3">
                  {/* Puntaje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntaje obtenido (máximo: {pregunta.puntaje})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={pregunta.puntaje}
                      step="0.5"
                      value={calificaciones[pregunta.respuesta_estudiante.id]?.puntaje_obtenido || 0}
                      onChange={(e) =>
                        handleCalificacionChange(
                          pregunta.respuesta_estudiante.id,
                          'puntaje_obtenido',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Retroalimentación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Retroalimentación</label>
                    <textarea
                      value={calificaciones[pregunta.respuesta_estudiante.id]?.retroalimentacion || ''}
                      onChange={(e) =>
                        handleCalificacionChange(
                          pregunta.respuesta_estudiante.id,
                          'retroalimentacion',
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Comentarios para el estudiante..."
                    />
                  </div>

                  {/* Botón guardar */}
                  <button
                    onClick={() => handleGuardarCalificacion(pregunta.respuesta_estudiante.id)}
                    disabled={guardando}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {guardando ? 'Guardando...' : 'Guardar Calificación'}
                  </button>
                </div>
              </div>
            )}

            {/* Mostrar retroalimentación si ya está calificada */}
            {!requiereCalificacionManual(pregunta) &&
              pregunta.respuesta_estudiante?.retroalimentacion && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Retroalimentación:</p>
                  <p className="text-sm text-blue-800">{pregunta.respuesta_estudiante.retroalimentacion}</p>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

CalificarIntento.propTypes = {
  intento: PropTypes.object.isRequired,
  onVolver: PropTypes.func.isRequired,
  onPublicar: PropTypes.func.isRequired,
};

export default CalificarIntento;
