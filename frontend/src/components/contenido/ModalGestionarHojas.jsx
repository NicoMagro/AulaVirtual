import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import hojasService from '../../services/hojasService';

const ModalGestionarHojas = ({ isOpen, onClose, hojas, aula_id, onSuccess }) => {
  const [listaHojas, setListaHojas] = useState(hojas);
  const [modalEditar, setModalEditar] = useState(false);
  const [hojaEditar, setHojaEditar] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', orden: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAgregarHoja = () => {
    setHojaEditar(null);
    setFormData({ nombre: '', orden: hojas.length });
    setModalEditar(true);
  };

  const handleEditarHoja = (hoja) => {
    setHojaEditar(hoja);
    setFormData({ nombre: hoja.nombre, orden: hoja.orden });
    setModalEditar(true);
  };

  const handleEliminarHoja = async (hoja_id) => {
    if (listaHojas.length <= 1) {
      alert('No se puede eliminar la única hoja del aula');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar esta hoja? Se eliminará todo su contenido.')) {
      return;
    }

    try {
      setError(null);
      await hojasService.eliminarHoja(hoja_id);
      setListaHojas(listaHojas.filter(h => h.id !== hoja_id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la hoja');
      console.error(err);
    }
  };

  const handleGuardarHoja = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (hojaEditar) {
        // Actualizar hoja existente
        await hojasService.actualizarHoja(hojaEditar.id, formData);
        setListaHojas(listaHojas.map(h =>
          h.id === hojaEditar.id ? { ...h, ...formData } : h
        ));
      } else {
        // Crear nueva hoja
        const response = await hojasService.crearHoja({
          aula_id,
          ...formData,
        });
        setListaHojas([...listaHojas, response.data]);
      }
      setModalEditar(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la hoja');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Gestionar Hojas</h2>
          <button
            onClick={handleCerrar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Lista de hojas */}
          <div className="space-y-3 mb-6">
            {listaHojas.map((hoja, index) => (
              <div
                key={hoja.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 font-medium">#{index + 1}</span>
                  <span className="font-medium text-gray-900">{hoja.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditarHoja(hoja)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleEliminarHoja(hoja.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                    disabled={listaHojas.length <= 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botón agregar hoja */}
          <button
            onClick={handleAgregarHoja}
            className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            Agregar Nueva Hoja
          </button>
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCerrar}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal secundario para editar/crear hoja */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {hojaEditar ? 'Editar Hoja' : 'Nueva Hoja'}
              </h3>
              <button
                onClick={() => setModalEditar(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarHoja} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Hoja
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Unidad 1, General, etc."
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden
                  <span className="text-gray-500 text-xs ml-2">
                    (posición en las pestañas)
                  </span>
                </label>
                <input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : hojaEditar ? 'Guardar Cambios' : 'Crear Hoja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ModalGestionarHojas.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  hojas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
      orden: PropTypes.number.isRequired,
    })
  ).isRequired,
  aula_id: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default ModalGestionarHojas;
