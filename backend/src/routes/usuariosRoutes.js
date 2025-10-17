const express = require('express');
const { query, body, param } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  listarUsuariosPorRol,
  obtenerUsuarios,
  obtenerRoles,
  agregarRolUsuario,
  quitarRolUsuario,
} = require('../controllers/usuariosController');

const router = express.Router();

// ============================================
// Validaciones
// ============================================

const validacionListarPorRol = [
  query('rol')
    .notEmpty()
    .withMessage('El rol es obligatorio')
    .isIn(['admin', 'profesor', 'estudiante'])
    .withMessage('Rol inválido'),
  query('busqueda')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('La búsqueda debe tener al menos 1 carácter'),
];

const validacionAgregarRol = [
  body('usuario_id')
    .isUUID()
    .withMessage('ID de usuario inválido'),
  body('rol_id')
    .isInt({ min: 1, max: 3 })
    .withMessage('ID de rol inválido'),
];

const validacionQuitarRol = [
  param('usuario_id')
    .isUUID()
    .withMessage('ID de usuario inválido'),
  param('rol_id')
    .isInt({ min: 1, max: 3 })
    .withMessage('ID de rol inválido'),
];

// ============================================
// Rutas
// ============================================

/**
 * GET /api/usuarios
 * Obtener todos los usuarios con sus roles
 * Acceso: Solo administradores
 */
router.get(
  '/',
  autenticar,
  autorizarRoles('admin'),
  obtenerUsuarios
);

/**
 * GET /api/usuarios/roles
 * Obtener todos los roles disponibles
 * Acceso: Solo administradores
 */
router.get(
  '/roles',
  autenticar,
  autorizarRoles('admin'),
  obtenerRoles
);

/**
 * GET /api/usuarios/por-rol
 * Listar usuarios filtrados por rol
 * Acceso: Solo administradores
 */
router.get(
  '/por-rol',
  autenticar,
  autorizarRoles('admin'),
  validacionListarPorRol,
  listarUsuariosPorRol
);

/**
 * POST /api/usuarios/agregar-rol
 * Agregar un rol a un usuario
 * Acceso: Solo administradores
 */
router.post(
  '/agregar-rol',
  autenticar,
  autorizarRoles('admin'),
  validacionAgregarRol,
  agregarRolUsuario
);

/**
 * DELETE /api/usuarios/:usuario_id/roles/:rol_id
 * Quitar un rol de un usuario
 * Acceso: Solo administradores
 */
router.delete(
  '/:usuario_id/roles/:rol_id',
  autenticar,
  autorizarRoles('admin'),
  validacionQuitarRol,
  quitarRolUsuario
);

module.exports = router;
