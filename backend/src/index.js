const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const aulasRoutes = require('./routes/aulasRoutes');
const matriculacionRoutes = require('./routes/matriculacionRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const contenidoRoutes = require('./routes/contenidoRoutes');
const hojasRoutes = require('./routes/hojasRoutes');
const archivosRoutes = require('./routes/archivosRoutes');
const consultasRoutes = require('./routes/consultasRoutes');
const evaluacionesRoutes = require('./routes/evaluacionesRoutes');
const preguntasRoutes = require('./routes/preguntasRoutes');
const intentosRoutes = require('./routes/intentosRoutes');
const notificacionesRoutes = require('./routes/notificacionesRoutes');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Hacer io accesible globalmente
global.io = io;

// ============================================
// Middlewares
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads) - DEBE ir antes de las rutas
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Rutas de archivos
app.use('/api/archivos', archivosRoutes);

// Rutas de consultas
app.use('/api/consultas', consultasRoutes);

// Rutas de evaluaciones
app.use('/api/evaluaciones', evaluacionesRoutes);

// Rutas de preguntas
app.use('/api/preguntas', preguntasRoutes);

// Rutas de intentos
app.use('/api/intentos', intentosRoutes);

// Rutas de notificaciones
app.use('/api/notificaciones', notificacionesRoutes);

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
// Configurar WebSocket
// ============================================
socketHandler(io);

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

    // Iniciar servidor con Socket.IO
    server.listen(PORT, () => {
      console.log('===========================================');
      console.log(`✓ Servidor corriendo en puerto ${PORT}`);
      console.log(`✓ Ambiente: ${process.env.NODE_ENV}`);
      console.log(`✓ URL: http://localhost:${PORT}`);
      console.log(`✓ WebSocket habilitado`);
      console.log('===========================================');
    });

  } catch (error) {
    console.error('✗ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
