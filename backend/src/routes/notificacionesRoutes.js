const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/auth');
const {
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion
} = require('../controllers/notificacionesController');

// Todas las rutas requieren autenticación
router.use(autenticar);

// Obtener notificaciones del usuario autenticado
router.get('/', obtenerNotificaciones);

// Marcar notificación como leída
router.put('/:notificacion_id/leida', marcarComoLeida);

// Marcar todas como leídas
router.put('/marcar-todas-leidas', marcarTodasComoLeidas);

// Eliminar notificación
router.delete('/:notificacion_id', eliminarNotificacion);

module.exports = router;
