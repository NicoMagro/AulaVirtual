import PropTypes from 'prop-types';
import { Plus, Settings } from 'lucide-react';

const TabsHojas = ({ hojas, hojaActiva, onCambiarHoja, onGestionarHojas, esProfesor }) => {
  return (
    <div className="border-b border-gray-200 bg-white rounded-t-lg">
      <div className="flex items-center justify-between px-4">
        {/* Pestañas */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0">
          {hojas.map((hoja) => (
            <button
              key={hoja.id}
              onClick={() => onCambiarHoja(hoja)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                hojaActiva?.id === hoja.id
                  ? 'text-primary-600 border-primary-600 bg-primary-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {hoja.nombre}
            </button>
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
    })
  ).isRequired,
  hojaActiva: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
  }),
  onCambiarHoja: PropTypes.func.isRequired,
  onGestionarHojas: PropTypes.func.isRequired,
  esProfesor: PropTypes.bool.isRequired,
};

export default TabsHojas;
