import { useState } from 'react';
import { X, Lock, Unlock, AlertCircle } from 'lucide-react';
import matriculacionService from '../../services/matriculacionService';

const ModalGestionarClave = ({ isOpen, onClose, aula, onSuccess }) => {
  const [clave, setClave] = useState('');
  const [tipoAula, setTipoAula] = useState(aula?.requiere_clave ? 'privada' : 'publica');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const claveToSend = tipoAula === 'publica' ? null : clave;

      if (tipoAula === 'privada' && (!clave || clave.trim().length < 4)) {
        setError('La clave debe tener al menos 4 caracteres');
        setLoading(false);
        return;
      }

      await matriculacionService.gestionarClaveMatriculacion(aula.id, claveToSend);
      setSuccess(
        tipoAula === 'publica'
          ? 'El aula ahora es pública. Cualquier estudiante puede unirse.'
          : 'Clave de matriculación actualizada correctamente.'
      );
      onSuccess();

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al gestionar la clave');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestionar Clave</h2>
            <p className="text-sm text-gray-600 mt-1">{aula?.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Aula
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipoAula"
                  value="publica"
                  checked={tipoAula === 'publica'}
                  onChange={(e) => setTipoAula(e.target.value)}
                  className="mr-3"
                />
                <Unlock size={18} className="mr-2 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Aula Pública</p>
                  <p className="text-xs text-gray-600">
                    Cualquier estudiante puede unirse sin clave
                  </p>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipoAula"
                  value="privada"
                  checked={tipoAula === 'privada'}
                  onChange={(e) => setTipoAula(e.target.value)}
                  className="mr-3"
                />
                <Lock size={18} className="mr-2 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Aula Privada</p>
                  <p className="text-xs text-gray-600">
                    Requiere clave de matriculación para unirse
                  </p>
                </div>
              </label>
            </div>
          </div>

          {tipoAula === 'privada' && (
            <div>
              <label htmlFor="clave" className="block text-sm font-medium text-gray-700 mb-1">
                Clave de Matriculación *
              </label>
              <input
                type="text"
                id="clave"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ingresa la clave (mínimo 4 caracteres)"
                minLength={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Los estudiantes necesitarán esta clave para matricularse
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalGestionarClave;
