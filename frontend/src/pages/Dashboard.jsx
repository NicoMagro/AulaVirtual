import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Aula Virtual</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.nombre} {user?.apellido}
              </span>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                {user?.roles?.[0] || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Bienvenido, {user?.nombre}!
            </h2>
            <p className="text-gray-600 mb-4">
              Has iniciado sesión exitosamente en Aula Virtual.
            </p>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h3 className="font-semibold text-primary-900 mb-2">Información de tu cuenta:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="font-medium">Email:</span> {user?.email}
                </li>
                <li>
                  <span className="font-medium">Rol:</span> {user?.roles?.join(', ')}
                </li>
                <li>
                  <span className="font-medium">ID:</span> {user?.id}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
