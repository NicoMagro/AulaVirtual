import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, AlertCircle, Plus, Trash2, Info } from 'lucide-react';
import evaluacionesService from '../../services/evaluacionesService';

const ModalCrearPregunta = ({ isOpen, onClose, evaluacion_id, pregunta, onSuccess }) => {
  const esNuevo = !pregunta;

  const [formData, setFormData] = useState({
    tipo_pregunta: 'multiple_choice',
    enunciado: '',
    puntaje: 1.0,
    orden: 0,
    requiere_justificacion: false,
    respuesta_correcta: true, // Para V/F
    opciones: [
      { texto: '', es_correcta: true, orden: 0 },
      { texto: '', es_correcta: false, orden: 1 },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pregunta) {
      // Modo edición
      setFormData({
        tipo_pregunta: pregunta.tipo_pregunta,
        enunciado: pregunta.enunciado,
        puntaje: pregunta.puntaje,
        orden: pregunta.orden,
        requiere_justificacion: pregunta.requiere_justificacion || false,
        respuesta_correcta: pregunta.respuesta_correcta !== undefined ? pregunta.respuesta_correcta : true,
        opciones: pregunta.opciones || [
          { texto: '', es_correcta: true, orden: 0 },
          { texto: '', es_correcta: false, orden: 1 },
        ],
      });
    } else {
      // Modo creación
      setFormData({
        tipo_pregunta: 'multiple_choice',
        enunciado: '',
        puntaje: 1.0,
        orden: 0,
        requiere_justificacion: false,
        respuesta_correcta: true,
        opciones: [
          { texto: '', es_correcta: true, orden: 0 },
          { texto: '', es_correcta: false, orden: 1 },
        ],
      });
    }
  }, [pregunta, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleTipoPreguntaChange = (e) => {
    const nuevoTipo = e.target.value;
    setFormData({
      ...formData,
      tipo_pregunta: nuevoTipo,
      requiere_justificacion: nuevoTipo === 'verdadero_falso_justificacion',
    });
  };

  // Manejo de opciones para multiple choice
  const handleOpcionChange = (index, field, value) => {
    const nuevasOpciones = [...formData.opciones];
    nuevasOpciones[index] = {
      ...nuevasOpciones[index],
      [field]: value,
      orden: index,
    };
    setFormData({
      ...formData,
      opciones: nuevasOpciones,
    });
  };

  const handleAgregarOpcion = () => {
    setFormData({
      ...formData,
      opciones: [
        ...formData.opciones,
        { texto: '', es_correcta: false, orden: formData.opciones.length },
      ],
    });
  };

  const handleEliminarOpcion = (index) => {
    if (formData.opciones.length <= 2) {
      alert('Debe haber al menos 2 opciones');
      return;
    }
    const nuevasOpciones = formData.opciones
      .filter((_, i) => i !== index)
      .map((op, idx) => ({ ...op, orden: idx }));
    setFormData({
      ...formData,
      opciones: nuevasOpciones,
    });
  };

  const validarFormulario = () => {
    // Validaciones generales
    if (!formData.enunciado.trim()) {
      setError('El enunciado es obligatorio');
      return false;
    }

    if (formData.puntaje <= 0) {
      setError('El puntaje debe ser mayor a 0');
      return false;
    }

    // Validaciones específicas por tipo
    if (formData.tipo_pregunta === 'multiple_choice') {
      if (formData.opciones.length < 2) {
        setError('Debe haber al menos 2 opciones');
        return false;
      }

      // Verificar que todas las opciones tengan texto
      const opcionVacia = formData.opciones.some(op => !op.texto.trim());
      if (opcionVacia) {
        setError('Todas las opciones deben tener texto');
        return false;
      }

      // Verificar que haya al menos una opción correcta
      const hayCorrecta = formData.opciones.some(op => op.es_correcta);
      if (!hayCorrecta) {
        setError('Debe haber al menos una opción correcta');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      const datos = {
        evaluacion_id,
        tipo_pregunta: formData.tipo_pregunta,
        enunciado: formData.enunciado.trim(),
        puntaje: parseFloat(formData.puntaje),
        orden: parseInt(formData.orden),
        requiere_justificacion: formData.tipo_pregunta === 'verdadero_falso_justificacion',
      };

      // Agregar campos específicos según el tipo
      if (formData.tipo_pregunta === 'multiple_choice') {
        datos.opciones = formData.opciones.map((op, idx) => ({
          texto: op.texto.trim(),
          es_correcta: op.es_correcta,
          orden: idx,
        }));
      }

      if (
        formData.tipo_pregunta === 'verdadero_falso' ||
        formData.tipo_pregunta === 'verdadero_falso_justificacion'
      ) {
        datos.respuesta_correcta = formData.respuesta_correcta;
      }

      if (esNuevo) {
        await evaluacionesService.crearPregunta(datos);
      } else {
        await evaluacionesService.actualizarPregunta(pregunta.id, datos);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la pregunta');
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
            {esNuevo ? 'Crear Nueva Pregunta' : 'Editar Pregunta'}
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

          {/* Tipo de Pregunta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pregunta <span className="text-red-500">*</span>
            </label>
            <select
              name="tipo_pregunta"
              value={formData.tipo_pregunta}
              onChange={handleTipoPreguntaChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={!esNuevo} // No se puede cambiar el tipo en edición
            >
              <option value="multiple_choice">Múltiple Choice</option>
              <option value="verdadero_falso">Verdadero o Falso</option>
              <option value="verdadero_falso_justificacion">Verdadero/Falso con Justificación</option>
              <option value="desarrollo">Desarrollo (Respuesta Abierta)</option>
            </select>
            {!esNuevo && (
              <p className="mt-1 text-xs text-gray-500">
                No se puede cambiar el tipo de pregunta al editar
              </p>
            )}
          </div>

          {/* Enunciado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enunciado <span className="text-red-500">*</span>
            </label>
            <textarea
              name="enunciado"
              value={formData.enunciado}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Escribe la pregunta aquí..."
              required
            />
          </div>

          {/* Puntaje */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntaje
              </label>
              <input
                type="number"
                name="puntaje"
                value={formData.puntaje}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden
              </label>
              <input
                type="number"
                name="orden"
                value={formData.orden}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Opciones para Multiple Choice */}
          {formData.tipo_pregunta === 'multiple_choice' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Opciones</h3>
                <button
                  type="button"
                  onClick={handleAgregarOpcion}
                  className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Agregar Opción
                </button>
              </div>

              <div className="space-y-3">
                {formData.opciones.map((opcion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-600 mt-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={opcion.texto}
                      onChange={(e) => handleOpcionChange(index, 'texto', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Texto de la opción"
                      required
                    />
                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap mt-2">
                      <input
                        type="checkbox"
                        checked={opcion.es_correcta}
                        onChange={(e) => handleOpcionChange(index, 'es_correcta', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Correcta</span>
                    </label>
                    {formData.opciones.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleEliminarOpcion(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <p>
                  Puedes marcar una o más opciones como correctas. Al menos una debe ser correcta.
                </p>
              </div>
            </div>
          )}

          {/* Respuesta Correcta para Verdadero/Falso */}
          {(formData.tipo_pregunta === 'verdadero_falso' ||
            formData.tipo_pregunta === 'verdadero_falso_justificacion') && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Respuesta Correcta</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="respuesta_correcta"
                    checked={formData.respuesta_correcta === true}
                    onChange={() => setFormData({ ...formData, respuesta_correcta: true })}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="font-medium">Verdadero</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="respuesta_correcta"
                    checked={formData.respuesta_correcta === false}
                    onChange={() => setFormData({ ...formData, respuesta_correcta: false })}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="font-medium">Falso</span>
                </label>
              </div>

              {formData.tipo_pregunta === 'verdadero_falso_justificacion' && (
                <div className="flex items-start gap-2 text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <p>
                    Esta pregunta requerirá que el estudiante justifique su respuesta. La calificación será manual.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info para Desarrollo */}
          {formData.tipo_pregunta === 'desarrollo' && (
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <p>
                Los estudiantes responderán con texto libre. La calificación será manual por parte del profesor.
              </p>
            </div>
          )}

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
              {loading ? 'Guardando...' : esNuevo ? 'Crear Pregunta' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ModalCrearPregunta.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  evaluacion_id: PropTypes.string.isRequired,
  pregunta: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};

export default ModalCrearPregunta;
