import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRoute from './components/HomeRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';

// Admin
import GestionAulas from './pages/admin/GestionAulas';
import GestionUsuarios from './pages/admin/GestionUsuarios';

// Profesor
import MisAulasProfesor from './pages/profesor/MisAulas';

// Estudiante
import ExplorarAulas from './pages/estudiante/ExplorarAulas';
import MisAulasEstudiante from './pages/estudiante/MisAulas';

// Compartidas
import VistaAula from './pages/VistaAula';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

          {/* Rutas protegidas con Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Vista de Aula (accesible para todos los roles autenticados) */}
          <Route
            path="/aula/:aula_id"
            element={
              <ProtectedRoute>
                <Layout>
                  <VistaAula />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Rutas de Administrador */}
          <Route
            path="/admin/aulas"
            element={
              <ProtectedRoute rolesPermitidos={['admin']}>
                <Layout>
                  <GestionAulas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute rolesPermitidos={['admin']}>
                <Layout>
                  <GestionUsuarios />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Rutas de Profesor */}
          <Route
            path="/profesor/mis-aulas"
            element={
              <ProtectedRoute rolesPermitidos={['profesor']}>
                <Layout>
                  <MisAulasProfesor />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Rutas de Estudiante */}
          <Route
            path="/estudiante/explorar"
            element={
              <ProtectedRoute rolesPermitidos={['estudiante']}>
                <Layout>
                  <ExplorarAulas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudiante/mis-aulas"
            element={
              <ProtectedRoute rolesPermitidos={['estudiante']}>
                <Layout>
                  <MisAulasEstudiante />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  </Router>
  );
}

export default App;
