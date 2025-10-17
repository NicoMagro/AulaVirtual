import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, rolesPermitidos = [] }) => {
  const { isAuthenticated, loading, rolActivo } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary-500 text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles permitidos, verificar que el rol activo esté permitido
  if (rolesPermitidos.length > 0) {
    const tieneAcceso = rolesPermitidos.includes(rolActivo);

    if (!tieneAcceso) {
      // Redirigir al dashboard si el rol activo no tiene acceso
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
