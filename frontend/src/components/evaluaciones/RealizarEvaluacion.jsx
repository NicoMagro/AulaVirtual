import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, Clock, Send, Save, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';

const RealizarEvaluacion = ({ evaluacion, onVolver }) => {
  const [intento, setIntento] = useState(null);
  const [preguntas, setPreguntasConRespuestas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const intervaloRef = useRef(null);

  // Iniciar intento al montar
  useEffect(() => {
    iniciarObtenerIntento();
    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [evaluacion.id]);

  // Control de tiempo
  useEffect(() => {
    if (intento && intento.duracion_maxima_minutos) {
      calcularTiempoRestante();
      intervaloRef.current = setInterval(calcularTiempoRestante, 1000);
      return () => clearInterval(intervaloRef.current);
    }
  }, [intento]);

  const iniciarObtenerIntento = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar si ya hay un intento en progreso
      const intentosResponse = await evaluacionesService.obtenerMisIntentos(evaluacion.id);
      const intentoEnProgreso = intentosResponse.data.find(i => i.estado === 'en_progreso');

      let intentoId;
      if (intentoEnProgreso) {
        // Ya existe un intento en progreso, usarlo
        intentoId = intentoEnProgreso.id;
      } else {
        // Iniciar nuevo intento
        try {
          const response = await evaluacionesService.iniciarIntento(evaluacion.id);
          intentoId = response.data.intento_id;
        } catch (iniciarError) {
          // Si el error es porque ya hay un intento en progreso, obtener el ID
          if (iniciarError.response?.data?.intento_id) {
            intentoId = iniciarError.response.data.intento_id;
          } else {
            throw iniciarError;
          }
        }
      }

      // Obtener el intento completo con preguntas
      const intentoResponse = await evaluacionesService.obtenerIntento(intentoId);
      setIntento(intentoResponse.data.intento);

      // Filtrar respuestas correctas si el intento está en progreso
      const preguntasFiltradas = intentoResponse.data.preguntas.map(pregunta => {
        const preguntaLimpia = { ...pregunta };

        // Solo mostrar respuestas correctas si el intento está calificado/publicado
        if (intentoResponse.data.intento.estado === 'en_progreso') {
          delete preguntaLimpia.respuesta_correcta;
          delete preguntaLimpia.opciones_correctas_ids;
        }

        return preguntaLimpia;
      });

      setPreguntasConRespuestas(preguntasFiltradas);

      // Cargar respuestas existentes
      const respuestasExistentes = {};
      intentoResponse.data.preguntas.forEach(pregunta => {
        if (pregunta.respuesta_estudiante) {
          const respuestaBase = {
            respuesta_booleana: pregunta.respuesta_estudiante.respuesta_booleana,
            respuesta_texto: pregunta.respuesta_estudiante.respuesta_texto || '',
            justificacion: pregunta.respuesta_estudiante.justificacion || '',
          };

          // Para multiple choice, soportar tanto múltiples IDs como un ID único (legacy)
          if (pregunta.tipo_pregunta === 'multiple_choice') {
            if (pregunta.respuesta_estudiante.opciones_seleccionadas && pregunta.respuesta_estudiante.opciones_seleccionadas.length > 0) {
              // Usar el array de opciones seleccionadas si existe
              respuestaBase.opciones_seleccionadas = pregunta.respuesta_estudiante.opciones_seleccionadas;
            } else if (pregunta.respuesta_estudiante.opcion_seleccionada_id) {
              // Fallback para compatibilidad con datos antiguos
              respuestaBase.opciones_seleccionadas = [pregunta.respuesta_estudiante.opcion_seleccionada_id];
            } else {
              respuestaBase.opciones_seleccionadas = [];
            }
          }

          respuestasExistentes[pregunta.id] = respuestaBase;
        } else if (pregunta.tipo_pregunta === 'multiple_choice') {
          // Inicializar array vacío para nuevas preguntas de multiple choice
          respuestasExistentes[pregunta.id] = {
            opciones_seleccionadas: [],
          };
        }
      });
      setRespuestas(respuestasExistentes);
    } catch (err) {
      console.error('Error al iniciar intento:', err);
      setError(err.response?.data?.message || 'Error al iniciar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const calcularTiempoRestante = () => {
    if (!intento) return;

    const ahora = new Date();
    let tiempoLimite;

    // Determinar el tiempo límite: el menor entre duración máxima y fecha fin
    if (intento.duracion_maxima_minutos && intento.fecha_fin_evaluacion) {
      const finPorDuracion = new Date(intento.fecha_inicio);
      finPorDuracion.setMinutes(finPorDuracion.getMinutes() + intento.duracion_maxima_minutos);
      const finPorFecha = new Date(intento.fecha_fin_evaluacion);
      tiempoLimite = finPorDuracion < finPorFecha ? finPorDuracion : finPorFecha;
    } else if (intento.duracion_maxima_minutos) {
      tiempoLimite = new Date(intento.fecha_inicio);
      tiempoLimite.setMinutes(tiempoLimite.getMinutes() + intento.duracion_maxima_minutos);
    } else if (intento.fecha_fin_evaluacion) {
      tiempoLimite = new Date(intento.fecha_fin_evaluacion);
    }

    if (tiempoLimite) {
      const diferencia = tiempoLimite - ahora;
      if (diferencia <= 0) {
        // Se acabó el tiempo, entregar automáticamente
        handleEntregar(true);
      } else {
        setTiempoRestante(Math.floor(diferencia / 1000));
      }
    }
  };

  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
  };

  const handleRespuestaChange = (preguntaId, campo, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: {
        ...prev[preguntaId],
        [campo]: valor,
      },
    }));
  };

  const handleGuardar = async (mostrarMensaje = true) => {
    try {
      setGuardando(true);

      // Guardar todas las respuestas
      for (const [preguntaId, respuesta] of Object.entries(respuestas)) {
        if (respuesta && Object.keys(respuesta).length > 0) {
          await evaluacionesService.guardarRespuesta(intento.id, {
            pregunta_id: preguntaId,
            ...respuesta,
          });
        }
      }

      if (mostrarMensaje) {
        alert('Respuestas guardadas exitosamente');
      }
    } catch (err) {
      console.error('Error al guardar respuestas:', err);
      alert('Error al guardar las respuestas');
    } finally {
      setGuardando(false);
    }
  };

  const handleEntregar = async (automatico = false) => {
    if (!automatico) {
      if (!window.confirm('¿Estás seguro de entregar la evaluación? No podrás modificar tus respuestas después.')) {
        return;
      }
    }

    try {
      setLoading(true);

      // Guardar respuestas antes de entregar
      await handleGuardar(false);

      // Entregar intento
      const response = await evaluacionesService.entregarIntento(intento.id);

      alert(
        automatico
          ? 'Se acabó el tiempo. Tu evaluación ha sido entregada automáticamente.'
          : response.data.requiere_calificacion_manual
          ? 'Evaluación entregada. Será calificada por el profesor.'
          : `Evaluación entregada. Tu nota es: ${response.data.nota_obtenida}`
      );

      onVolver();
    } catch (err) {
      console.error('Error al entregar intento:', err);
      alert('Error al entregar la evaluación');
    } finally {
      setLoading(false);
    }
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con timer */}
      <div className="sticky top-0 bg-white border-b border-gray-200 pb-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onVolver}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{evaluacion.titulo}</h2>
              <p className="text-sm text-gray-600">Intento {intento?.numero_intento}</p>
            </div>
          </div>

          {tiempoRestante !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              tiempoRestante < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock size={20} />
              <span className="text-lg font-mono font-bold">
                {formatearTiempo(tiempoRestante)}
              </span>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={() => handleGuardar()}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {guardando ? 'Guardando...' : 'Guardar Progreso'}
          </button>

          <button
            onClick={() => handleEntregar()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={18} />
            Entregar Evaluación
          </button>
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-6">
        {preguntas.map((pregunta, index) => (
          <div key={pregunta.id} className="bg-white border border-gray-200 rounded-lg p-6">
            {/* Encabezado de pregunta */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
              <div className="flex-1">
                <p className="text-gray-900 font-medium mb-2">{pregunta.enunciado}</p>

                {/* Imágenes de la pregunta */}
                {pregunta.imagenes && pregunta.imagenes.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 my-3">
                    {pregunta.imagenes.map((imagen) => (
                      <div key={imagen.id} className="relative group">
                        <img
                          src={evaluacionesService.obtenerUrlImagen(imagen.nombre_archivo)}
                          alt="Imagen de pregunta"
                          className="w-full rounded-lg border border-gray-200 cursor-pointer"
                          onClick={(e) => window.open(e.target.src, '_blank')}
                        />
                        <div className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon size={14} className="text-gray-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-xs text-gray-500">
                  {pregunta.puntaje} {pregunta.puntaje === 1 ? 'punto' : 'puntos'}
                </span>
              </div>
            </div>

            {/* Opciones según tipo de pregunta */}
            {pregunta.tipo_pregunta === 'multiple_choice' && (
              <div className="space-y-2">
                {pregunta.opciones.map((opcion) => {
                  const opcionesSeleccionadas = respuestas[pregunta.id]?.opciones_seleccionadas || [];
                  const isChecked = opcionesSeleccionadas.includes(opcion.id);

                  return (
                    <label
                      key={opcion.id}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg hover:bg-gray-50 cursor-pointer ${
                        isChecked ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const currentSelections = respuestas[pregunta.id]?.opciones_seleccionadas || [];
                          let newSelections;

                          if (e.target.checked) {
                            newSelections = [...currentSelections, opcion.id];
                          } else {
                            newSelections = currentSelections.filter(id => id !== opcion.id);
                          }

                          handleRespuestaChange(pregunta.id, 'opciones_seleccionadas', newSelections);
                        }}
                        className="w-4 h-4 text-primary-600 mt-1 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-gray-900">{opcion.texto}</span>

                        {/* Imágenes de la opción */}
                        {opcion.imagenes && opcion.imagenes.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {opcion.imagenes.map((imagen) => (
                              <div key={imagen.id} className="relative group">
                                <img
                                  src={evaluacionesService.obtenerUrlImagen(imagen.nombre_archivo)}
                                  alt="Imagen de opción"
                                  className="w-full h-20 object-cover rounded border border-gray-200 cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.open(e.target.src, '_blank');
                                  }}
                                />
                                <div className="absolute top-0.5 right-0.5 bg-white bg-opacity-80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ImageIcon size={12} className="text-gray-600" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {(pregunta.tipo_pregunta === 'verdadero_falso' ||
              pregunta.tipo_pregunta === 'verdadero_falso_justificacion') && (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name={`pregunta_${pregunta.id}`}
                      checked={respuestas[pregunta.id]?.respuesta_booleana === true}
                      onChange={() => handleRespuestaChange(pregunta.id, 'respuesta_booleana', true)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <CheckCircle size={18} className="text-green-600" />
                    <span className="font-medium">Verdadero</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name={`pregunta_${pregunta.id}`}
                      checked={respuestas[pregunta.id]?.respuesta_booleana === false}
                      onChange={() => handleRespuestaChange(pregunta.id, 'respuesta_booleana', false)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <AlertCircle size={18} className="text-red-600" />
                    <span className="font-medium">Falso</span>
                  </label>
                </div>

                {pregunta.tipo_pregunta === 'verdadero_falso_justificacion' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Justificación <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={respuestas[pregunta.id]?.justificacion || ''}
                      onChange={(e) => handleRespuestaChange(pregunta.id, 'justificacion', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Justifica tu respuesta..."
                    />
                  </div>
                )}
              </div>
            )}

            {pregunta.tipo_pregunta === 'desarrollo' && (
              <div>
                <textarea
                  value={respuestas[pregunta.id]?.respuesta_texto || ''}
                  onChange={(e) => handleRespuestaChange(pregunta.id, 'respuesta_texto', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Escribe tu respuesta aquí..."
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botones finales */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 pb-4">
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => handleGuardar()}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {guardando ? 'Guardando...' : 'Guardar Progreso'}
          </button>

          <button
            onClick={() => handleEntregar()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={18} />
            Entregar Evaluación
          </button>
        </div>
      </div>
    </div>
  );
};

RealizarEvaluacion.propTypes = {
  evaluacion: PropTypes.object.isRequired,
  onVolver: PropTypes.func.isRequired,
};

export default RealizarEvaluacion;
