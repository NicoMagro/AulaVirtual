const db = require('../config/database');

/**
 * Listar usuarios por rol (para administradores)
 */
const listarUsuariosPorRol = async (req, res) => {
  try {
    const { rol, busqueda } = req.query;

    let query = `
      SELECT DISTINCT
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.activo
      FROM usuarios u
      INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
      INNER JOIN roles r ON ur.rol_id = r.id
      WHERE r.nombre = $1 AND u.activo = true
    `;

    const params = [rol];

    // Si hay búsqueda, agregar filtro
    if (busqueda) {
      query += ` AND (
        LOWER(u.nombre) LIKE LOWER($2) OR
        LOWER(u.apellido) LIKE LOWER($2) OR
        LOWER(u.email) LIKE LOWER($2) OR
        LOWER(u.nombre || ' ' || u.apellido) LIKE LOWER($2)
      )`;
      params.push(`%${busqueda}%`);
    }

    query += ' ORDER BY u.nombre, u.apellido';

    const usuarios = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: usuarios.rows,
      total: usuarios.rows.length,
    });

  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los usuarios',
      error: error.message,
    });
  }
};

module.exports = {
  listarUsuariosPorRol,
};
