import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle, XCircle, Eye } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';

const MisNotasEvaluacion = ({ evaluacion, onVolver, onVerResultados }) => {
  const [intentos, setIntentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarMisIntentos();
  }, [evaluacion.id]);

  const cargarMisIntentos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionesService.obtenerMisIntentos(evaluacion.id);
      setIntentos(response.data || []);
    } catch (err) {
      console.error('Error al cargar intentos:', err);
      setError('Error al cargar tus intentos');
    } finally {
      setLoading(false);
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

  const obtenerEstadoBadge = (intento) => {
    if (intento.estado === 'en_progreso') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-blue-100 text-blue-700">
          <Clock size={14} />
          En Progreso
        </span>
      );
    }

    if (intento.estado === 'entregado') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-yellow-100 text-yellow-700">
          <AlertCircle size={14} />
          Pendiente de Calificación
        </span>
      );
    }

    if (intento.estado === 'calificado') {
      const aprobado = parseFloat(intento.nota_obtenida || 0) >= parseFloat(evaluacion.nota_minima_aprobacion || 0);
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {aprobado ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {aprobado ? 'Aprobado' : 'Desaprobado'}
        </span>
      );
    }

    return null;
  };

  const calcularPorcentaje = (puntaje, puntaje_total) => {
    if (!puntaje_total || puntaje_total === 0) return 0;
    return ((puntaje / puntaje_total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onVolver}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Intentos</h2>
          <p className="text-sm text-gray-600">{evaluacion.titulo}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Información de la evaluación */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 font-medium">Intentos realizados</p>
            <p className="text-xl font-bold text-primary-600">
              {intentos.length} / {evaluacion.intentos_permitidos}
            </p>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Nota mínima</p>
            <p className="text-xl font-bold text-primary-600">{evaluacion.nota_minima_aprobacion}</p>
          </div>
          <div>
            <p className="text-gray-600 font-medium">Mejor nota</p>
            <p className="text-xl font-bold text-primary-600">
              {intentos.length > 0
                ? Math.max(...intentos.filter(i => i.nota_obtenida !== null).map(i => parseFloat(i.nota_obtenida || 0)), 0).toFixed(2)
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de intentos */}
      {intentos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            No has realizado intentos en esta evaluación
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {intentos.map((intento) => (
            <div
              key={intento.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Información del intento */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Intento #{intento.numero_intento}
                    </h3>
                    {obtenerEstadoBadge(intento)}
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <div>
                        <p className="font-medium">Fecha de inicio</p>
                        <p className="text-xs">{formatearFecha(intento.fecha_inicio)}</p>
                      </div>
                    </div>

                    {intento.fecha_entrega && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <div>
                          <p className="font-medium">Fecha de entrega</p>
                          <p className="text-xs">{formatearFecha(intento.fecha_entrega)}</p>
                        </div>
                      </div>
                    )}

                    {intento.tiempo_usado_minutos && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <div>
                          <p className="font-medium">Tiempo usado</p>
                          <p className="text-xs">{intento.tiempo_usado_minutos} minutos</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Puntaje y nota (solo si está calificado) */}
                  {intento.estado === 'calificado' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Puntaje obtenido</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-primary-600">
                              {intento.puntaje_obtenido || 0}
                            </span>
                            <span className="text-sm text-gray-500">/ {intento.puntaje_total}</span>
                            <span className="text-sm text-gray-500">
                              ({calcularPorcentaje(intento.puntaje_obtenido || 0, intento.puntaje_total)}%)
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Nota final</p>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${
                              parseFloat(intento.nota_obtenida || 0) >= parseFloat(evaluacion.nota_minima_aprobacion || 0)
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {parseFloat(intento.nota_obtenida).toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500">/ 10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón de acción */}
                {intento.estado === 'calificado' && (
                  <div className="ml-4">
                    <button
                      onClick={() => onVerResultados(intento)}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Eye size={18} />
                      Ver Resultados
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

MisNotasEvaluacion.propTypes = {
  evaluacion: PropTypes.object.isRequired,
  onVolver: PropTypes.func.isRequired,
  onVerResultados: PropTypes.func.isRequired,
};

export default MisNotasEvaluacion;
