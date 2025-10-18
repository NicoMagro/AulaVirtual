import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import matriculacionService from '../../services/matriculacionService';
import { LogOut, Users, Calendar, User, AlertCircle, Eye } from 'lucide-react';

const MisAulas = () => {
  const navigate = useNavigate();
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarMisAulas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await matriculacionService.misAulas();
      setAulas(response.data);
    } catch (err) {
      setError('Error al cargar tus aulas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisAulas();
  }, []);

  const handleDesmatricularse = async (aula_id, aula_nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas salir del aula "${aula_nombre}"?`)) {
      return;
    }

    try {
      await matriculacionService.desmatricularseDeAula(aula_id);
      cargarMisAulas();
    } catch (err) {
      alert('Error al desmatricularse del aula');
      console.error(err);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Aulas</h1>
        <p className="text-gray-600 mt-1">Aulas en las que estás matriculado</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aulas.map((aula) => (
          <div
            key={aula.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{aula.nombre}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar size={14} />
                Matriculado: {formatearFecha(aula.fecha_matriculacion)}
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {aula.descripcion || 'Sin descripción'}
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Users size={14} />
                  Estudiantes:
                </span>
                <span className="font-medium text-gray-900">
                  {aula.total_estudiantes || 0} / {aula.capacidad_maxima}
                </span>
              </div>

              {aula.profesores && aula.profesores.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <User size={12} />
                    Profesores:
                  </p>
                  <div className="space-y-1">
                    {aula.profesores.map((profesor) => (
                      <div key={profesor.id} className="text-xs text-gray-600">
                        {profesor.nombre} {profesor.apellido}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate(`/aula/${aula.id}`)}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Eye size={16} />
                Entrar al Aula
              </button>
              <button
                onClick={() => handleDesmatricularse(aula.id, aula.nombre)}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                Salir del Aula
              </button>
            </div>
          </div>
        ))}
      </div>

      {aulas.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No estás matriculado en ningún aula</p>
          <p className="text-gray-400 text-sm mt-2">
            Explora las aulas disponibles y únete a una
          </p>
        </div>
      )}
    </div>
  );
};

export default MisAulas;
