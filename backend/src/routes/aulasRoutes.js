const express = require('express');
const { body, param } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  crearAula,
  listarAulas,
  obtenerAula,
  actualizarAula,
  eliminarAula,
  asignarProfesor,
  desasignarProfesor,
  misAulasProfesor,
} = require('../controllers/aulasController');

const router = express.Router();

// ============================================
// Validaciones
// ============================================

const validacionCrearAula = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('capacidad_maxima')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('La capacidad máxima debe ser un número entre 1 y 1000'),
];

const validacionActualizarAula = [
  param('id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('capacidad_maxima')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('La capacidad máxima debe ser un número entre 1 y 1000'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser un booleano'),
];

const validacionIdAula = [
  param('id')
    .isUUID()
    .withMessage('ID de aula inválido'),
];

const validacionAsignarProfesor = [
  body('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('profesor_id')
    .isUUID()
    .withMessage('ID de profesor inválido'),
];

const validacionDesasignarProfesor = [
  param('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  param('profesor_id')
    .isUUID()
    .withMessage('ID de profesor inválido'),
];

// ============================================
// Rutas públicas (requieren autenticación)
// ============================================

/**
 * GET /api/aulas
 * Listar todas las aulas
 * Acceso: Todos los usuarios autenticados
 */
router.get('/', autenticar, listarAulas);

/**
 * GET /api/aulas/mis-aulas-profesor
 * Listar aulas donde el profesor está asignado
 * Acceso: Solo profesores
 */
router.get('/mis-aulas-profesor', autenticar, autorizarRoles('profesor'), misAulasProfesor);

/**
 * GET /api/aulas/:id
 * Obtener un aula por ID
 * Acceso: Todos los usuarios autenticados
 */
router.get('/:id', autenticar, validacionIdAula, obtenerAula);

// ============================================
// Rutas protegidas (solo administradores)
// ============================================

/**
 * POST /api/aulas
 * Crear una nueva aula
 * Acceso: Solo administradores
 */
router.post(
  '/',
  autenticar,
  autorizarRoles('admin'),
  validacionCrearAula,
  crearAula
);

/**
 * PUT /api/aulas/:id
 * Actualizar un aula
 * Acceso: Solo administradores
 */
router.put(
  '/:id',
  autenticar,
  autorizarRoles('admin'),
  validacionActualizarAula,
  actualizarAula
);

/**
 * DELETE /api/aulas/:id
 * Eliminar (desactivar) un aula
 * Acceso: Solo administradores
 */
router.delete(
  '/:id',
  autenticar,
  autorizarRoles('admin'),
  validacionIdAula,
  eliminarAula
);

/**
 * POST /api/aulas/asignar-profesor
 * Asignar un profesor a un aula
 * Acceso: Solo administradores
 */
router.post(
  '/asignar-profesor',
  autenticar,
  autorizarRoles('admin'),
  validacionAsignarProfesor,
  asignarProfesor
);

/**
 * DELETE /api/aulas/:aula_id/profesores/:profesor_id
 * Desasignar un profesor de un aula
 * Acceso: Solo administradores
 */
router.delete(
  '/:aula_id/profesores/:profesor_id',
  autenticar,
  autorizarRoles('admin'),
  validacionDesasignarProfesor,
  desasignarProfesor
);

module.exports = router;
