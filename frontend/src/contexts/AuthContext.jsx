import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [rolActivo, setRolActivo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al cargar
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);

      // Restaurar rol activo del localStorage o usar el primero disponible
      const savedRolActivo = localStorage.getItem('rolActivo');
      if (savedRolActivo && currentUser.roles?.includes(savedRolActivo)) {
        setRolActivo(savedRolActivo);
      } else if (currentUser.roles && currentUser.roles.length > 0) {
        setRolActivo(currentUser.roles[0]);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const usuario = response.data.usuario;
    setUser(usuario);

    // Establecer el primer rol como activo por defecto
    if (usuario.roles && usuario.roles.length > 0) {
      const primerRol = usuario.roles[0];
      setRolActivo(primerRol);
      localStorage.setItem('rolActivo', primerRol);
    }

    return response;
  };

  const registro = async (datos) => {
    const response = await authService.registro(datos);
    const usuario = response.data.usuario;
    setUser(usuario);

    // Establecer el primer rol como activo por defecto
    if (usuario.roles && usuario.roles.length > 0) {
      const primerRol = usuario.roles[0];
      setRolActivo(primerRol);
      localStorage.setItem('rolActivo', primerRol);
    }

    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRolActivo(null);
    localStorage.removeItem('rolActivo');
  };

  const cambiarRol = (nuevoRol) => {
    if (user?.roles?.includes(nuevoRol)) {
      setRolActivo(nuevoRol);
      localStorage.setItem('rolActivo', nuevoRol);
    }
  };

  const value = {
    user,
    rolActivo,
    loading,
    login,
    registro,
    logout,
    cambiarRol,
    isAuthenticated: !!user,
    tieneMultiplesRoles: user?.roles?.length > 1,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
