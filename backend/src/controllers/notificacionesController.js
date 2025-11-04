const db = require('../config/database');

/**
 * Crear una notificación y emitirla vía WebSocket
 */
const crearNotificacion = async (datos) => {
  const { usuario_id, tipo, titulo, mensaje, aula_id, consulta_id } = datos;

  try {
    const result = await db.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, aula_id, consulta_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [usuario_id, tipo, titulo, mensaje, aula_id || null, consulta_id || null]
    );

    const notificacion = result.rows[0];

    // Emitir notificación vía WebSocket si el usuario está conectado
    if (global.io && global.io.sendToUser) {
      global.io.sendToUser(usuario_id, 'nueva_notificacion', notificacion);
    }

    return notificacion;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

/**
 * Obtener todas las notificaciones de un usuario
 */
const obtenerNotificaciones = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const { limit = 50, offset = 0, solo_no_leidas = false } = req.query;

    let query = `
      SELECT n.*,
             a.nombre as aula_nombre,
             c.titulo as consulta_titulo
      FROM notificaciones n
      LEFT JOIN aulas a ON n.aula_id = a.id
      LEFT JOIN consultas c ON n.consulta_id = c.id
      WHERE n.usuario_id = $1
    `;

    const params = [usuario_id];

    if (solo_no_leidas === 'true') {
      query += ' AND n.leida = false';
    }

    query += ' ORDER BY n.fecha_creacion DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Obtener contador de no leídas
    const countResult = await db.query(
      'SELECT COUNT(*) FROM notificaciones WHERE usuario_id = $1 AND leida = false',
      [usuario_id]
    );

    res.json({
      success: true,
      data: result.rows,
      no_leidas: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones'
    });
  }
};

/**
 * Marcar notificación como leída
 */
const marcarComoLeida = async (req, res) => {
  try {
    const { notificacion_id } = req.params;
    const usuario_id = req.usuario.id;

    await db.query(
      `UPDATE notificaciones
       SET leida = true, fecha_lectura = CURRENT_TIMESTAMP
       WHERE id = $1 AND usuario_id = $2`,
      [notificacion_id, usuario_id]
    );

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación'
    });
  }
};

/**
 * Marcar todas las notificaciones como leídas
 */
const marcarTodasComoLeidas = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;

    await db.query(
      `UPDATE notificaciones
       SET leida = true, fecha_lectura = CURRENT_TIMESTAMP
       WHERE usuario_id = $1 AND leida = false`,
      [usuario_id]
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificaciones'
    });
  }
};

/**
 * Eliminar notificación
 */
const eliminarNotificacion = async (req, res) => {
  try {
    const { notificacion_id } = req.params;
    const usuario_id = req.usuario.id;

    await db.query(
      'DELETE FROM notificaciones WHERE id = $1 AND usuario_id = $2',
      [notificacion_id, usuario_id]
    );

    res.json({
      success: true,
      message: 'Notificación eliminada'
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación'
    });
  }
};

module.exports = {
  crearNotificacion,
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion
};
