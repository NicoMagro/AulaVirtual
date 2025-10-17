import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, rolesPermitidos = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

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

  // Si se especificaron roles permitidos, verificar que el usuario tenga alguno
  if (rolesPermitidos.length > 0) {
    const tieneRolPermitido = user?.roles?.some((rol) => rolesPermitidos.includes(rol));

    if (!tieneRolPermitido) {
      // Redirigir al dashboard si no tiene el rol necesario
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
