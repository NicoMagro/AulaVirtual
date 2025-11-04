const jwt = require('jsonwebtoken');

// Mapa para almacenar usuarios conectados {usuarioId: socketId}
const connectedUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Nueva conexión WebSocket: ${socket.id}`);

    // Autenticar usuario
    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;

        // Almacenar usuario conectado
        connectedUsers.set(decoded.id, socket.id);

        console.log(`✓ Usuario autenticado: ${decoded.id} (socket: ${socket.id})`);

        // Confirmar autenticación
        socket.emit('authenticated', { success: true, userId: decoded.id });
      } catch (error) {
        console.error('✗ Error de autenticación WebSocket:', error.message);
        socket.emit('authentication_error', { error: 'Token inválido' });
      }
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`🔌 Usuario desconectado: ${socket.userId}`);
      }
    });

    // Marcar notificación como leída
    socket.on('marcar_leida', async (notificacionId) => {
      try {
        const db = require('../config/database');
        await db.query(
          'UPDATE notificaciones SET leida = true, fecha_lectura = CURRENT_TIMESTAMP WHERE id = $1 AND usuario_id = $2',
          [notificacionId, socket.userId]
        );
        socket.emit('notificacion_marcada', { id: notificacionId });
      } catch (error) {
        console.error('Error al marcar notificación:', error);
      }
    });
  });

  // Función auxiliar para enviar notificación a un usuario específico
  io.sendToUser = (userId, event, data) => {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  };

  // Función auxiliar para enviar notificación a múltiples usuarios
  io.sendToUsers = (userIds, event, data) => {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (io.sendToUser(userId, event, data)) {
        sentCount++;
      }
    });
    return sentCount;
  };
};
