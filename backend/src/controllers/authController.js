const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');

/**
 * Controlador para registrar un nuevo usuario
 */
const registro = async (req, res) => {
  try {
    // Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { nombre, apellido, email, password } = req.body;

    // Verificar si el email ya existe
    const emailExiste = await db.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExiste.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Iniciar transacción
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Insertar el nuevo usuario
      const nuevoUsuario = await client.query(
        `INSERT INTO usuarios (nombre, apellido, email, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nombre, apellido, email, activo, fecha_creacion`,
        [nombre, apellido, email, passwordHash]
      );

      const usuario = nuevoUsuario.rows[0];

      // Asignar rol por defecto (estudiante - id: 3)
      await client.query(
        `INSERT INTO usuario_roles (usuario_id, rol_id)
         VALUES ($1, $2)`,
        [usuario.id, 3] // 3 = estudiante
      );

      // Obtener el rol asignado
      const rolesUsuario = await client.query(
        `SELECT r.nombre
         FROM roles r
         INNER JOIN usuario_roles ur ON r.id = ur.rol_id
         WHERE ur.usuario_id = $1`,
        [usuario.id]
      );

      await client.query('COMMIT');

      // Generar token JWT
      const token = generateToken({
        id: usuario.id,
        email: usuario.email,
        roles: rolesUsuario.rows.map(r => r.nombre),
      });

      // Responder con éxito
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            activo: usuario.activo,
            roles: rolesUsuario.rows.map(r => r.nombre),
            fecha_creacion: usuario.fecha_creacion,
          },
          token,
        },
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el usuario',
      error: error.message,
    });
  }
};

/**
 * Controlador para login de usuario
 */
const login = async (req, res) => {
  try {
    // Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Buscar el usuario por email
    const usuarioResult = await db.query(
      `SELECT id, nombre, apellido, email, password_hash, activo
       FROM usuarios
       WHERE email = $1`,
      [email]
    );

    if (usuarioResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const usuario = usuarioResult.rows[0];

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
      });
    }

    // Verificar la contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Obtener los roles del usuario
    const rolesResult = await db.query(
      `SELECT r.nombre
       FROM roles r
       INNER JOIN usuario_roles ur ON r.id = ur.rol_id
       WHERE ur.usuario_id = $1`,
      [usuario.id]
    );

    const roles = rolesResult.rows.map(r => r.nombre);

    // Generar token JWT
    const token = generateToken({
      id: usuario.id,
      email: usuario.email,
      roles: roles,
    });

    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          roles: roles,
        },
        token,
      },
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message,
    });
  }
};

module.exports = {
  registro,
  login,
};
