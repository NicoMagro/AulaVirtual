import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';

const VerResultados = ({ intento: intentoInicial, evaluacion, onVolver }) => {
  const [intento, setIntento] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarResultados();
  }, [intentoInicial.id]);

  const cargarResultados = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionesService.obtenerIntento(intentoInicial.id);
      setIntento(response.data.intento);
      setPreguntas(response.data.preguntas);
    } catch (err) {
      console.error('Error al cargar resultados:', err);
      setError('Error al cargar los resultados');
    } finally {
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
        <div className="space-y-3">
          <div>
            <p className="font-medium mb-2 text-sm text-gray-700">Tu respuesta:</p>
            <div
              className={`p-3 rounded-lg border-2 ${
                respuesta.es_correcta
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {respuesta.es_correcta ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <XCircle size={18} className="text-red-600" />
                )}
                <span>{opcionSeleccionada?.texto || 'Opción no encontrada'}</span>
              </div>
            </div>
          </div>

          {!respuesta.es_correcta && (
            <div>
              <p className="font-medium text-sm text-gray-700 mb-2">Respuesta(s) correcta(s):</p>
              <div className="space-y-2">
                {pregunta.opciones
                  ?.filter((o) => o.es_correcta)
                  .map((o) => (
                    <div key={o.id} className="p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm text-green-800">{o.texto}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (pregunta.tipo_pregunta === 'verdadero_falso' || pregunta.tipo_pregunta === 'verdadero_falso_justificacion') {
      const esCorrecta = respuesta.respuesta_booleana === pregunta.respuesta_correcta;
      return (
        <div className="space-y-3">
          <div>
            <p className="font-medium mb-2 text-sm text-gray-700">Tu respuesta:</p>
            <div
              className={`p-3 rounded-lg border-2 flex items-center gap-2 ${
                esCorrecta ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
              }`}
            >
              {esCorrecta ? (
                <CheckCircle size={18} className="text-green-600" />
              ) : (
                <XCircle size={18} className="text-red-600" />
              )}
              <span className="font-medium">
                {respuesta.respuesta_booleana ? 'Verdadero' : 'Falso'}
              </span>
            </div>
          </div>

          {!esCorrecta && (
            <div>
              <p className="font-medium text-sm text-gray-700 mb-2">Respuesta correcta:</p>
              <div className="p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {pregunta.respuesta_correcta ? 'Verdadero' : 'Falso'}
                </span>
              </div>
            </div>
          )}

          {pregunta.tipo_pregunta === 'verdadero_falso_justificacion' && respuesta.justificacion && (
            <div>
              <p className="font-medium mb-2 text-sm text-gray-700">Tu justificación:</p>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{respuesta.justificacion}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (pregunta.tipo_pregunta === 'desarrollo') {
      return (
        <div>
          <p className="font-medium mb-2 text-sm text-gray-700">Tu respuesta:</p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap text-sm">
              {respuesta.respuesta_texto || 'Sin respuesta'}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const calcularPorcentaje = (puntaje, puntaje_total) => {
    if (!puntaje_total || puntaje_total === 0) return 0;
    return ((puntaje / puntaje_total) * 100).toFixed(1);
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

  const aprobado = parseFloat(intento?.nota_obtenida || 0) >= parseFloat(evaluacion.nota_minima_aprobacion || 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="sticky top-0 bg-white border-b border-gray-200 pb-4 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onVolver} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Resultados de la Evaluación</h2>
            <p className="text-sm text-gray-600">
              {evaluacion.titulo} - Intento #{intento?.numero_intento}
            </p>
          </div>
        </div>

        {/* Resumen de calificación */}
        <div className={`rounded-lg p-6 border-2 ${
          aprobado ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {aprobado ? (
              <CheckCircle size={32} className="text-green-600" />
            ) : (
              <XCircle size={32} className="text-red-600" />
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {aprobado ? 'Aprobado' : 'Desaprobado'}
              </p>
              <p className="text-sm text-gray-600">
                Nota mínima requerida: {evaluacion.nota_minima_aprobacion}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Puntaje obtenido</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {intento?.puntaje_obtenido || 0}
                </span>
                <span className="text-lg text-gray-500">/ {intento?.puntaje_total}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calcularPorcentaje(intento?.puntaje_obtenido || 0, intento?.puntaje_total)}% de aciertos
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Nota final</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${
                  aprobado ? 'text-green-700' : 'text-red-700'
                }`}>
                  {parseFloat(intento?.nota_obtenida).toFixed(2)}
                </span>
                <span className="text-lg text-gray-500">/ 10</span>
              </div>
            </div>

            {intento?.tiempo_usado_minutos && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Tiempo utilizado</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {intento.tiempo_usado_minutos}
                  </span>
                  <span className="text-lg text-gray-500">min</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preguntas y respuestas */}
      <div className="space-y-6">
        {preguntas.map((pregunta, index) => {
          const respuesta = pregunta.respuesta_estudiante;
          const puntajeObtenido = respuesta?.puntaje_obtenido || 0;
          const porcentajePregunta = ((puntajeObtenido / pregunta.puntaje) * 100).toFixed(0);

          return (
            <div key={pregunta.id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Encabezado de pregunta */}
              <div className="flex items-start gap-3 mb-4">
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-3">{pregunta.enunciado}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Vale {pregunta.puntaje} {pregunta.puntaje === 1 ? 'punto' : 'puntos'}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        puntajeObtenido === pregunta.puntaje
                          ? 'bg-green-100 text-green-700'
                          : puntajeObtenido === 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      Obtuviste: {puntajeObtenido} ({porcentajePregunta}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Respuesta del estudiante */}
              <div className="mb-4">{renderRespuestaEstudiante(pregunta)}</div>

              {/* Retroalimentación del profesor */}
              {respuesta?.retroalimentacion_profesor && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle size={18} className="text-blue-600 mt-0.5" />
                      <p className="text-sm font-semibold text-blue-900">Retroalimentación del profesor:</p>
                    </div>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap ml-6">
                      {respuesta.retroalimentacion_profesor}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pie de página */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 pb-4">
        <button
          onClick={onVolver}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
        >
          Volver a Mis Intentos
        </button>
      </div>
    </div>
  );
};

VerResultados.propTypes = {
  intento: PropTypes.object.isRequired,
  evaluacion: PropTypes.object.isRequired,
  onVolver: PropTypes.func.isRequired,
};

export default VerResultados;
