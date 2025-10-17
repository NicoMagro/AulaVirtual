import { useState } from 'react';
import { X, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import matriculacionService from '../../services/matriculacionService';

const ModalMatricularse = ({ isOpen, onClose, aula, onSuccess }) => {
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (aula.requiere_clave && !clave.trim()) {
        setError('Debes ingresar la clave de matriculación');
        setLoading(false);
        return;
      }

      await matriculacionService.matricularseEnAula(
        aula.id,
        aula.requiere_clave ? clave : null
      );

      setSuccess(true);
      onSuccess();

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al matricularse');
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
            <h2 className="text-2xl font-bold text-gray-900">Matricularse en Aula</h2>
            <p className="text-sm text-gray-600 mt-1">{aula?.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
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
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle size={18} />
            ¡Te has matriculado exitosamente!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              {aula?.descripcion || 'Sin descripción disponible'}
            </p>
            <div className="mt-3 text-sm text-gray-600">
              <p>
                <span className="font-medium">Capacidad:</span> {aula?.estudiantes_actuales || 0} /{' '}
                {aula?.capacidad_maxima}
              </p>
            </div>
          </div>

          {aula?.requiere_clave ? (
            <div>
              <label htmlFor="clave" className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Lock size={16} />
                  Clave de Matriculación *
                </div>
              </label>
              <input
                type="password"
                id="clave"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ingresa la clave proporcionada por el profesor"
                disabled={loading || success}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta aula requiere una clave. Solicítala al profesor del aula.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Esta es un aula pública. Puedes unirte sin necesidad de clave.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Matriculando...' : success ? 'Matriculado' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalMatricularse;
