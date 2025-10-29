import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, AlertCircle, Info } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';
import hojasService from '../../services/hojasService';

const ModalCrearEvaluacion = ({ isOpen, onClose, aula_id, evaluacion, onSuccess }) => {
  const esNuevo = !evaluacion;

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    hoja_id: '',
    nota_minima_aprobacion: 6.0,
    fecha_inicio: '',
    fecha_fin: '',
    duracion_maxima_minutos: '',
    intentos_permitidos: 1,
    cantidad_preguntas_mostrar: 10,
    orden_aleatorio: false,
    mostrar_respuestas_correctas: true,
    estado: 'borrador',
  });

  const [hojas, setHojas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHojas, setLoadingHojas] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      cargarHojas();
    }
  }, [isOpen, aula_id]);

  useEffect(() => {
    if (evaluacion) {
      setFormData({
        titulo: evaluacion.titulo || '',
        descripcion: evaluacion.descripcion || '',
        hoja_id: evaluacion.hoja_id || '',
        nota_minima_aprobacion: evaluacion.nota_minima_aprobacion || 6.0,
        fecha_inicio: formatearFechaParaInput(evaluacion.fecha_inicio),
        fecha_fin: formatearFechaParaInput(evaluacion.fecha_fin),
        duracion_maxima_minutos: evaluacion.duracion_maxima_minutos || '',
        intentos_permitidos: evaluacion.intentos_permitidos || 1,
        cantidad_preguntas_mostrar: evaluacion.cantidad_preguntas_mostrar || 10,
        orden_aleatorio: evaluacion.orden_aleatorio || false,
        mostrar_respuestas_correctas: evaluacion.mostrar_respuestas_correctas !== undefined
          ? evaluacion.mostrar_respuestas_correctas
          : true,
        estado: evaluacion.estado || 'borrador',
      });
    } else {
      // Resetear formulario para nueva evaluación
      setFormData({
        titulo: '',
        descripcion: '',
        hoja_id: '',
        nota_minima_aprobacion: 6.0,
        fecha_inicio: '',
        fecha_fin: '',
        duracion_maxima_minutos: '',
        intentos_permitidos: 1,
        cantidad_preguntas_mostrar: 10,
        orden_aleatorio: false,
        mostrar_respuestas_correctas: true,
        estado: 'borrador',
      });
    }
  }, [evaluacion, isOpen]);

  const cargarHojas = async () => {
    try {
      setLoadingHojas(true);
      const response = await hojasService.obtenerHojasAula(aula_id);
      setHojas(response.data || []);
    } catch (err) {
      console.error('Error al cargar hojas:', err);
    } finally {
      setLoadingHojas(false);
    }
  };

  const formatearFechaParaInput = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Preparar datos para enviar
      const datos = {
        aula_id,
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        hoja_id: formData.hoja_id || null,
        nota_minima_aprobacion: parseFloat(formData.nota_minima_aprobacion),
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        duracion_maxima_minutos: formData.duracion_maxima_minutos
          ? parseInt(formData.duracion_maxima_minutos)
          : null,
        intentos_permitidos: parseInt(formData.intentos_permitidos),
        cantidad_preguntas_mostrar: parseInt(formData.cantidad_preguntas_mostrar),
        orden_aleatorio: formData.orden_aleatorio,
        mostrar_respuestas_correctas: formData.mostrar_respuestas_correctas,
        estado: formData.estado,
      };

      // Validar fechas
      if (datos.fecha_inicio && datos.fecha_fin) {
        if (new Date(datos.fecha_inicio) >= new Date(datos.fecha_fin)) {
          setError('La fecha de inicio debe ser anterior a la fecha de fin');
          setLoading(false);
          return;
        }
      }

      if (esNuevo) {
        await evaluacionesService.crear(datos);
      } else {
        await evaluacionesService.actualizar(evaluacion.id, datos);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la evaluación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {esNuevo ? 'Crear Nueva Evaluación' : 'Editar Evaluación'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: Examen Final - Unidad 1"
                required
                maxLength={200}
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Instrucciones generales para los estudiantes..."
              />
            </div>

            {/* Hoja */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hoja del Aula (opcional)
              </label>
              {loadingHojas ? (
                <div className="text-sm text-gray-500">Cargando hojas...</div>
              ) : (
                <select
                  name="hoja_id"
                  value={formData.hoja_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sin hoja específica</option>
                  {hojas.map((hoja) => (
                    <option key={hoja.id} value={hoja.id}>
                      {hoja.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Estado y Configuración de Calificación */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Estado y Calificación</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado de la Evaluación
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="cerrado">Cerrado</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Solo las evaluaciones publicadas son visibles para los estudiantes
                </p>
              </div>

              {/* Nota Mínima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota Mínima de Aprobación (0-10)
                </label>
                <input
                  type="number"
                  name="nota_minima_aprobacion"
                  value={formData.nota_minima_aprobacion}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Configuración de Tiempo */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Temporalidad</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha de Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora de Inicio
                </label>
                <input
                  type="datetime-local"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Fecha de Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora de Fin
                </label>
                <input
                  type="datetime-local"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Duración máxima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración Máxima (minutos)
              </label>
              <input
                type="number"
                name="duracion_maxima_minutos"
                value={formData.duracion_maxima_minutos}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Dejar vacío para sin límite"
              />
              <p className="mt-1 text-sm text-gray-500 flex items-start gap-1">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <span>La fecha de fin tiene prioridad sobre la duración máxima</span>
              </p>
            </div>
          </div>

          {/* Configuración de Preguntas e Intentos */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Preguntas e Intentos</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Intentos Permitidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intentos Permitidos
                </label>
                <input
                  type="number"
                  name="intentos_permitidos"
                  value={formData.intentos_permitidos}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Cantidad de Preguntas a Mostrar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preguntas a Mostrar
                </label>
                <input
                  type="number"
                  name="cantidad_preguntas_mostrar"
                  value={formData.cantidad_preguntas_mostrar}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="orden_aleatorio"
                  checked={formData.orden_aleatorio}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Orden aleatorio de preguntas
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="mostrar_respuestas_correctas"
                  checked={formData.mostrar_respuestas_correctas}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mostrar respuestas correctas después de calificar
                </span>
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : esNuevo ? 'Crear Evaluación' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ModalCrearEvaluacion.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  aula_id: PropTypes.string.isRequired,
  evaluacion: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};

export default ModalCrearEvaluacion;
