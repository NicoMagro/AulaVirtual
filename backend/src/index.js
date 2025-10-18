const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const aulasRoutes = require('./routes/aulasRoutes');
const matriculacionRoutes = require('./routes/matriculacionRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const contenidoRoutes = require('./routes/contenidoRoutes');
const hojasRoutes = require('./routes/hojasRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middlewares
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ============================================
// Rutas
// ============================================

// Ruta de health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API AulaVirtual funcionando correctamente',
    version: '1.0.0',
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de aulas
app.use('/api/aulas', aulasRoutes);

// Rutas de matriculación
app.use('/api/matriculacion', matriculacionRoutes);

// Rutas de usuarios
app.use('/api/usuarios', usuariosRoutes);

// Rutas de contenido
app.use('/api/contenido', contenidoRoutes);

// Rutas de hojas
app.use('/api/hojas', hojasRoutes);

// ============================================
// Manejo de errores 404
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// ============================================
// Manejo de errores global
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// Iniciar servidor
// ============================================
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
      console.error('✗ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('===========================================');
      console.log(`✓ Servidor corriendo en puerto ${PORT}`);
      console.log(`✓ Ambiente: ${process.env.NODE_ENV}`);
      console.log(`✓ URL: http://localhost:${PORT}`);
      console.log('===========================================');
    });

  } catch (error) {
    console.error('✗ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
