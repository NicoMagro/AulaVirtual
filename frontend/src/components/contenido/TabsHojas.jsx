import PropTypes from 'prop-types';
import { Plus, Settings, Eye, EyeOff } from 'lucide-react';
import hojasService from '../../services/hojasService';
import { useState } from 'react';

const TabsHojas = ({ hojas, hojaActiva, onCambiarHoja, onGestionarHojas, esProfesor, onHojasActualizadas }) => {
  const [togglingId, setTogglingId] = useState(null);

  const handleToggleVisibilidad = async (e, hoja) => {
    e.stopPropagation();
    try {
      setTogglingId(hoja.id);
      await hojasService.cambiarVisibilidadHoja(hoja.id);
      // Recargar hojas
      if (onHojasActualizadas) {
        await onHojasActualizadas();
      }
    } catch (err) {
      console.error('Error al cambiar visibilidad:', err);
      alert('Error al cambiar la visibilidad de la hoja');
    } finally {
      setTogglingId(null);
    }
  };
  return (
    <div className="border-b border-gray-200 bg-white rounded-t-lg">
      <div className="flex items-center justify-between px-4">
        {/* Pestañas */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0">
          {hojas.map((hoja) => (
            <div key={hoja.id} className="relative group">
              <button
                onClick={() => onCambiarHoja(hoja)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
                  hojaActiva?.id === hoja.id
                    ? 'text-primary-600 border-primary-600 bg-primary-50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                } ${!hoja.visible && esProfesor ? 'opacity-60' : ''}`}
              >
                {hoja.nombre}
                {esProfesor && !hoja.visible && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                    Oculta
                  </span>
                )}
              </button>

              {/* Botón de toggle de visibilidad (solo profesores) */}
              {esProfesor && (
                <button
                  onClick={(e) => handleToggleVisibilidad(e, hoja)}
                  disabled={togglingId === hoja.id}
                  className="absolute -top-1 -right-1 p-1 bg-white hover:bg-gray-100 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title={hoja.visible ? 'Ocultar para estudiantes' : 'Mostrar a estudiantes'}
                >
                  {hoja.visible ? (
                    <Eye size={14} className="text-gray-600" />
                  ) : (
                    <EyeOff size={14} className="text-yellow-600" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Botón de gestión (solo profesores) */}
        {esProfesor && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onGestionarHojas}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Gestionar hojas"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Gestionar hojas</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

TabsHojas.propTypes = {
  hojas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
      orden: PropTypes.number.isRequired,
      visible: PropTypes.bool,
    })
  ).isRequired,
  hojaActiva: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
  }),
  onCambiarHoja: PropTypes.func.isRequired,
  onGestionarHojas: PropTypes.func.isRequired,
  esProfesor: PropTypes.bool.isRequired,
  onHojasActualizadas: PropTypes.func,
};

export default TabsHojas;
