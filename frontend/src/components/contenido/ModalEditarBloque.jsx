import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, AlertCircle } from 'lucide-react';
import contenidoService from '../../services/contenidoService';

const ModalEditarBloque = ({ isOpen, onClose, bloque, aula_id, hoja_id, onSuccess, esNuevo, ordenSiguiente }) => {
  const [formData, setFormData] = useState({
    tipo: 'parrafo',
    contenido: '',
    orden: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (esNuevo) {
      setFormData({
        tipo: 'parrafo',
        contenido: '',
        orden: ordenSiguiente,
      });
    } else if (bloque) {
      setFormData({
        tipo: bloque.tipo,
        contenido: bloque.contenido,
        orden: bloque.orden,
      });
    }
  }, [bloque, esNuevo, ordenSiguiente]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (esNuevo) {
        await contenidoService.crearBloque({
          aula_id,
          hoja_id,
          ...formData,
        });
      } else {
        await contenidoService.actualizarBloque(bloque.id, formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el bloque');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si se cambia el tipo a separador, establecer contenido por defecto
    if (name === 'tipo' && value === 'separador') {
      setFormData({
        ...formData,
        tipo: value,
        contenido: '---', // Contenido por defecto para separadores
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {esNuevo ? 'Agregar Bloque' : 'Editar Bloque'}
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

          {/* Tipo de bloque */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Bloque
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="titulo">Título Principal</option>
              <option value="subtitulo">Subtítulo</option>
              <option value="parrafo">Párrafo</option>
              <option value="lista">Lista</option>
              <option value="enlace">Enlace</option>
              <option value="separador">Separador</option>
            </select>
          </div>

          {/* Contenido */}
          {formData.tipo !== 'separador' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido
                {formData.tipo === 'lista' && (
                  <span className="text-gray-500 text-xs ml-2">
                    (un ítem por línea)
                  </span>
                )}
                {formData.tipo === 'enlace' && (
                  <span className="text-gray-500 text-xs ml-2">
                    (formato: Texto del enlace|URL o solo URL)
                  </span>
                )}
              </label>
              {formData.tipo === 'parrafo' || formData.tipo === 'lista' ? (
                <textarea
                  name="contenido"
                  value={formData.contenido}
                  onChange={handleChange}
                  rows={formData.tipo === 'lista' ? 6 : 4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder={
                    formData.tipo === 'lista'
                      ? 'Primer ítem\nSegundo ítem\nTercer ítem'
                      : 'Escribe el contenido del párrafo...'
                  }
                  required
                />
              ) : (
                <input
                  type="text"
                  name="contenido"
                  value={formData.contenido}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={
                    formData.tipo === 'titulo'
                      ? 'Título del contenido'
                      : formData.tipo === 'subtitulo'
                      ? 'Subtítulo o sección'
                      : 'Texto del enlace|https://ejemplo.com'
                  }
                  required
                />
              )}
            </div>
          )}

          {/* Orden */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Orden
              <span className="text-gray-500 text-xs ml-2">
                (los bloques se ordenan de menor a mayor)
              </span>
            </label>
            <input
              type="number"
              name="orden"
              value={formData.orden}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Vista previa del tipo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Vista Previa del Tipo:</p>
            <div className="text-sm text-gray-600">
              {formData.tipo === 'titulo' && 'Se mostrará como un título grande y destacado'}
              {formData.tipo === 'subtitulo' && 'Se mostrará como un subtítulo de sección'}
              {formData.tipo === 'parrafo' && 'Se mostrará como texto normal con saltos de línea'}
              {formData.tipo === 'lista' && 'Se mostrará como una lista con viñetas'}
              {formData.tipo === 'enlace' && 'Se mostrará como un enlace clicable que abre en nueva pestaña'}
              {formData.tipo === 'separador' && 'Se mostrará como una línea divisoria decorativa'}
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
              {loading ? 'Guardando...' : esNuevo ? 'Crear Bloque' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ModalEditarBloque.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bloque: PropTypes.object,
  aula_id: PropTypes.string.isRequired,
  hoja_id: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  esNuevo: PropTypes.bool.isRequired,
  ordenSiguiente: PropTypes.number.isRequired,
};

export default ModalEditarBloque;
