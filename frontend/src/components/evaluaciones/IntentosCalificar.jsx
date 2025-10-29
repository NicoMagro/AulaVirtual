import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, User, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';

const IntentosCalificar = ({ evaluacion, onVolver, onSeleccionarIntento }) => {
  const [intentos, setIntentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarIntentos();
  }, [evaluacion.id]);

  const cargarIntentos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionesService.obtenerIntentosPendientes(evaluacion.id);
      setIntentos(response.data || []);
    } catch (err) {
      console.error('Error al cargar intentos:', err);
      setError('Error al cargar los intentos');
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

  const obtenerEstadoBadge = (estado) => {
    const estados = {
      entregado: { color: 'bg-yellow-100 text-yellow-700', texto: 'Pendiente', icon: AlertCircle },
      calificado: { color: 'bg-green-100 text-green-700', texto: 'Calificado', icon: CheckCircle },
    };

    const estadoInfo = estados[estado] || estados.entregado;
    const Icon = estadoInfo.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${estadoInfo.color}`}>
        <Icon size={14} />
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

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onVolver}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calificar Intentos</h2>
          <p className="text-sm text-gray-600">{evaluacion.titulo}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Lista de intentos */}
      {intentos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            No hay intentos pendientes de calificación
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {intentos.map((intento) => (
            <div
              key={intento.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Información del estudiante e intento */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <User size={20} className="text-gray-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {intento.estudiante_nombre}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{intento.estudiante_email}</p>
                      <div className="flex items-center gap-2">
                        {obtenerEstadoBadge(intento.estado)}
                        <span className="text-xs text-gray-500">
                          Intento #{intento.numero_intento}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <div>
                        <p className="font-medium">Entregado</p>
                        <p className="text-xs">{formatearFecha(intento.fecha_entrega)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      <div>
                        <p className="font-medium">Tiempo usado</p>
                        <p className="text-xs">
                          {intento.tiempo_usado_minutos
                            ? `${intento.tiempo_usado_minutos} min`
                            : 'No disponible'}
                        </p>
                      </div>
                    </div>

                    {intento.nota_obtenida !== null && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle size={16} />
                        <div>
                          <p className="font-medium">Nota obtenida</p>
                          <p className="text-xs font-bold text-primary-600">
                            {parseFloat(intento.nota_obtenida).toFixed(2)} / 10
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Puntaje */}
                  <div className="mt-3 text-xs text-gray-500">
                    <span>
                      Puntaje: {intento.puntaje_obtenido || 0} / {intento.puntaje_total}
                    </span>
                  </div>
                </div>

                {/* Botón de acción */}
                <div className="ml-4">
                  <button
                    onClick={() => onSeleccionarIntento(intento)}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {intento.estado === 'entregado' ? 'Calificar' : 'Ver calificación'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

IntentosCalificar.propTypes = {
  evaluacion: PropTypes.object.isRequired,
  onVolver: PropTypes.func.isRequired,
  onSeleccionarIntento: PropTypes.func.isRequired,
};

export default IntentosCalificar;
