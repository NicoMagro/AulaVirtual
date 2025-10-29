import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  FileQuestion,
  Download,
} from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';

const EstadisticasEvaluacion = ({ evaluacion, onVolver }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
  }, [evaluacion.id]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluacionesService.obtenerEstadisticas(evaluacion.id);
      setEstadisticas(response.data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportarExcel = async () => {
    try {
      setExportando(true);
      await evaluacionesService.exportarEstadisticasExcel(evaluacion.id);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      alert('Error al exportar las estadísticas a Excel');
    } finally {
      setExportando(false);
    }
  };

  const handleExportarPDF = async () => {
    try {
      setExportandoPDF(true);
      await evaluacionesService.exportarEstadisticasPDF(evaluacion.id);
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      alert('Error al exportar las estadísticas a PDF');
    } finally {
      setExportandoPDF(false);
    }
  };

  if (loading) {
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

  const { metricas_generales, rendimiento_por_pregunta, distribucion_notas, estudiantes } = estadisticas;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={28} />
              Estadísticas
            </h2>
            <p className="text-sm text-gray-600">{evaluacion.titulo}</p>
          </div>
        </div>

        {/* Botones de exportación */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportarExcel}
            disabled={exportando}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={20} />
            {exportando ? 'Exportando...' : 'Exportar a Excel'}
          </button>

          <button
            onClick={handleExportarPDF}
            disabled={exportandoPDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={20} />
            {exportandoPDF ? 'Exportando...' : 'Exportar a PDF'}
          </button>
        </div>
      </div>

      {/* Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Estudiantes</p>
              <p className="text-2xl font-bold text-gray-900">{metricas_generales.total_estudiantes}</p>
              <p className="text-xs text-gray-500">{metricas_generales.total_intentos} intentos</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-green-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Nota Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{metricas_generales.nota_promedio.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                Min: {metricas_generales.nota_minima.toFixed(2)} / Max: {metricas_generales.nota_maxima.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Award size={24} className="text-purple-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Tasa de Aprobación</p>
              <p className="text-2xl font-bold text-gray-900">{metricas_generales.tasa_aprobacion}%</p>
              <p className="text-xs text-gray-500">
                <CheckCircle size={12} className="inline text-green-600" /> {metricas_generales.aprobados} aprobados /{' '}
                <XCircle size={12} className="inline text-red-600" /> {metricas_generales.desaprobados} desaprobados
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{metricas_generales.tiempo_promedio}</p>
              <p className="text-xs text-gray-500">minutos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de Notas */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Distribución de Notas
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(distribucion_notas).map(([rango, cantidad]) => (
            <div key={rango} className="text-center">
              <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-primary-500 transition-all duration-500"
                  style={{
                    height: `${
                      metricas_generales.intentos_calificados > 0
                        ? (cantidad / metricas_generales.intentos_calificados) * 100
                        : 0
                    }%`,
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{cantidad}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 font-medium">{rango}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rendimiento por Pregunta */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileQuestion size={20} />
          Rendimiento por Pregunta
        </h3>
        <div className="space-y-3">
          {rendimiento_por_pregunta.map((pregunta, index) => (
            <div key={pregunta.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {pregunta.tipo_pregunta}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{pregunta.enunciado}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-500">Puntaje máximo</p>
                  <p className="text-lg font-bold text-gray-900">{pregunta.puntaje_maximo}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Respuestas</p>
                  <p className="font-semibold text-gray-900">{pregunta.total_respuestas}</p>
                </div>
                <div>
                  <p className="text-gray-600">% Acierto</p>
                  <p
                    className={`font-semibold ${
                      pregunta.porcentaje_acierto >= 70
                        ? 'text-green-600'
                        : pregunta.porcentaje_acierto >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {pregunta.porcentaje_acierto.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Puntaje Prom.</p>
                  <p className="font-semibold text-gray-900">{pregunta.puntaje_promedio.toFixed(2)}</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      pregunta.porcentaje_acierto >= 70
                        ? 'bg-green-500'
                        : pregunta.porcentaje_acierto >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${pregunta.porcentaje_acierto}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Estudiantes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} />
          Estudiantes y sus Mejores Notas
        </h3>
        {estudiantes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay intentos calificados aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Intento</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Puntaje</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nota</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tiempo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {estudiantes.map((estudiante) => (
                  <tr key={estudiante.estudiante_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{estudiante.estudiante_nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{estudiante.estudiante_email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      #{estudiante.mejor_intento.numero_intento}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {estudiante.mejor_intento.puntaje_obtenido} / {estudiante.mejor_intento.puntaje_total}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-bold ${
                          estudiante.mejor_intento.aprobo ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {estudiante.mejor_intento.nota_obtenida.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {estudiante.mejor_intento.tiempo_usado_minutos || '-'} min
                    </td>
                    <td className="px-4 py-3 text-center">
                      {estudiante.mejor_intento.aprobo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle size={12} />
                          Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          <XCircle size={12} />
                          Desaprobado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatearFecha(estudiante.mejor_intento.fecha_entrega)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

EstadisticasEvaluacion.propTypes = {
  evaluacion: PropTypes.object.isRequired,
  onVolver: PropTypes.func.isRequired,
};

export default EstadisticasEvaluacion;
