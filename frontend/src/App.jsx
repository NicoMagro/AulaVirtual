import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';

// Admin
import GestionAulas from './pages/admin/GestionAulas';

// Profesor
import MisAulasProfesor from './pages/profesor/MisAulas';

// Estudiante
import ExplorarAulas from './pages/estudiante/ExplorarAulas';
import MisAulasEstudiante from './pages/estudiante/MisAulas';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
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

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
