const express = require('express');
const { query } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const { listarUsuariosPorRol } = require('../controllers/usuariosController');

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

// ============================================
// Rutas
// ============================================

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

module.exports = router;
