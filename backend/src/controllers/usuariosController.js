const db = require('../config/database');
const { validationResult } = require('express-validator');

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

/**
 * Obtener todos los usuarios del sistema con sus roles
 * Solo administradores
 */
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await db.query(
      `SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.activo,
        u.fecha_creacion,
        json_agg(
          jsonb_build_object(
            'id', r.id,
            'nombre', r.nombre,
            'descripcion', r.descripcion
          )
        ) FILTER (WHERE r.id IS NOT NULL) as roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      GROUP BY u.id
      ORDER BY u.fecha_creacion DESC`
    );

    res.status(200).json({
      success: true,
      data: usuarios.rows,
      total: usuarios.rows.length,
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de usuarios',
      error: error.message,
    });
  }
};

/**
 * Obtener todos los roles disponibles
 */
const obtenerRoles = async (req, res) => {
  try {
    const roles = await db.query(
      'SELECT id, nombre, descripcion FROM roles ORDER BY id'
    );

    res.status(200).json({
      success: true,
      data: roles.rows,
      total: roles.rows.length,
    });

  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de roles',
      error: error.message,
    });
  }
};

/**
 * Agregar un rol a un usuario
 */
const agregarRolUsuario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { usuario_id, rol_id } = req.body;

    // Verificar que el usuario existe
    const usuarioExiste = await db.query(
      'SELECT id FROM usuarios WHERE id = $1',
      [usuario_id]
    );

    if (usuarioExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Verificar que el rol existe
    const rolExiste = await db.query(
      'SELECT id, nombre FROM roles WHERE id = $1',
      [rol_id]
    );

    if (rolExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado',
      });
    }

    // Verificar si el usuario ya tiene ese rol
    const tieneRol = await db.query(
      'SELECT * FROM usuario_roles WHERE usuario_id = $1 AND rol_id = $2',
      [usuario_id, rol_id]
    );

    if (tieneRol.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El usuario ya tiene este rol asignado',
      });
    }

    // Asignar el rol
    await db.query(
      'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)',
      [usuario_id, rol_id]
    );

    res.status(201).json({
      success: true,
      message: `Rol ${rolExiste.rows[0].nombre} asignado exitosamente`,
    });

  } catch (error) {
    console.error('Error al agregar rol al usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar el rol al usuario',
      error: error.message,
    });
  }
};

/**
 * Quitar un rol de un usuario
 */
const quitarRolUsuario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { usuario_id, rol_id } = req.params;

    // Verificar que el usuario tiene al menos 2 roles antes de quitar uno
    const rolesUsuario = await db.query(
      'SELECT COUNT(*) as total FROM usuario_roles WHERE usuario_id = $1',
      [usuario_id]
    );

    if (parseInt(rolesUsuario.rows[0].total) <= 1) {
      return res.status(400).json({
        success: false,
        message: 'El usuario debe tener al menos un rol asignado',
      });
    }

    // Quitar el rol
    const resultado = await db.query(
      'DELETE FROM usuario_roles WHERE usuario_id = $1 AND rol_id = $2 RETURNING *',
      [usuario_id, rol_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no tiene este rol asignado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rol removido exitosamente',
    });

  } catch (error) {
    console.error('Error al quitar rol del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al quitar el rol del usuario',
      error: error.message,
    });
  }
};

module.exports = {
  listarUsuariosPorRol,
  obtenerUsuarios,
  obtenerRoles,
  agregarRolUsuario,
  quitarRolUsuario,
};
