import { useAuth } from '../contexts/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { LogOut, School, BookOpen, Users, Home, RefreshCw, Shield } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, rolActivo, tieneMultiplesRoles, cambiarRol, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCambiarRol = (nuevoRol) => {
    cambiarRol(nuevoRol);
    // Redirigir al dashboard cuando cambie de rol
    navigate('/dashboard');
  };

  const getNavLinks = () => {
    switch (rolActivo) {
      case 'admin':
        return [
          { to: '/dashboard', icon: Home, label: 'Inicio' },
          { to: '/admin/aulas', icon: School, label: 'Gestión de Aulas' },
          { to: '/admin/usuarios', icon: Users, label: 'Gestión de Usuarios' },
        ];
      case 'profesor':
        return [
          { to: '/dashboard', icon: Home, label: 'Inicio' },
          { to: '/profesor/mis-aulas', icon: BookOpen, label: 'Mis Aulas' },
        ];
      case 'estudiante':
        return [
          { to: '/dashboard', icon: Home, label: 'Inicio' },
          { to: '/estudiante/explorar', icon: School, label: 'Explorar Aulas' },
          { to: '/estudiante/mis-aulas', icon: BookOpen, label: 'Mis Aulas' },
        ];
      default:
        return [];
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'profesor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'estudiante':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 mr-8">Aula Virtual</h1>
              <div className="hidden md:flex space-x-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <link.icon size={18} />
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Selector de rol (solo si tiene múltiples roles) */}
              {tieneMultiplesRoles && user?.roles && (
                <div className="hidden sm:flex items-center gap-2 border-r pr-4">
                  <RefreshCw size={16} className="text-gray-500" />
                  <div className="flex gap-2">
                    {user.roles.map((rol) => (
                      <button
                        key={rol}
                        onClick={() => handleCambiarRol(rol)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          rolActivo === rol
                            ? getRolColor(rol) + ' ring-2 ring-offset-1 ring-primary-500'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                        title={`Cambiar a rol ${rol}`}
                      >
                        {rol}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Información del usuario */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs text-gray-600 flex items-center justify-end gap-1">
                  <Shield size={12} />
                  {rolActivo}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t border-gray-200 px-4 py-3">
          {/* Selector de rol móvil */}
          {tieneMultiplesRoles && user?.roles && (
            <div className="mb-3 pb-3 border-b">
              <p className="text-xs text-gray-500 mb-2">Cambiar rol:</p>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((rol) => (
                  <button
                    key={rol}
                    onClick={() => handleCambiarRol(rol)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      rolActivo === rol
                        ? getRolColor(rol) + ' ring-2 ring-offset-1 ring-primary-500'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {rol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Links de navegación móvil */}
          <div className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
