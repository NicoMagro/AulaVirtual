const express = require('express');
const { body, param } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  obtenerHojasAula,
  crearHoja,
  actualizarHoja,
  eliminarHoja,
  reordenarHojas,
  cambiarVisibilidadHoja,
} = require('../controllers/hojasController');

const router = express.Router();

// ============================================
// Validaciones
// ============================================

const validacionCrearHoja = [
  body('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('nombre')
    .notEmpty()
    .trim()
    .withMessage('El nombre de la hoja no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre de la hoja no puede exceder 100 caracteres'),
  body('orden')
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero positivo'),
];

const validacionActualizarHoja = [
  param('hoja_id')
    .isUUID()
    .withMessage('ID de hoja inválido'),
  body('nombre')
    .notEmpty()
    .trim()
    .withMessage('El nombre de la hoja no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El nombre de la hoja no puede exceder 100 caracteres'),
  body('orden')
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero positivo'),
];

const validacionEliminarHoja = [
  param('hoja_id')
    .isUUID()
    .withMessage('ID de hoja inválido'),
];

const validacionReordenar = [
  body('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('hojas')
    .isArray({ min: 1 })
    .withMessage('Debe proporcionar al menos una hoja'),
  body('hojas.*.id')
    .isUUID()
    .withMessage('ID de hoja inválido'),
  body('hojas.*.orden')
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero positivo'),
];

const validacionAulaId = [
  param('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
];

// ============================================
// Rutas
// ============================================

/**
 * GET /api/hojas/aula/:aula_id
 * Obtener todas las hojas de un aula
 * Acceso: Profesores y estudiantes con acceso al aula
 */
router.get(
  '/aula/:aula_id',
  autenticar,
  validacionAulaId,
  obtenerHojasAula
);

/**
 * POST /api/hojas
 * Crear una nueva hoja en un aula
 * Acceso: Solo profesores asignados al aula
 */
router.post(
  '/',
  autenticar,
  autorizarRoles('profesor'),
  validacionCrearHoja,
  crearHoja
);

/**
 * PUT /api/hojas/:hoja_id
 * Actualizar una hoja existente
 * Acceso: Solo profesores asignados al aula
 */
router.put(
  '/:hoja_id',
  autenticar,
  autorizarRoles('profesor'),
  validacionActualizarHoja,
  actualizarHoja
);

/**
 * DELETE /api/hojas/:hoja_id
 * Eliminar una hoja
 * Acceso: Solo profesores asignados al aula
 */
router.delete(
  '/:hoja_id',
  autenticar,
  autorizarRoles('profesor'),
  validacionEliminarHoja,
  eliminarHoja
);

/**
 * PUT /api/hojas/reordenar
 * Reordenar hojas de un aula
 * Acceso: Solo profesores asignados al aula
 */
router.put(
  '/reordenar/bulk',
  autenticar,
  autorizarRoles('profesor'),
  validacionReordenar,
  reordenarHojas
);

/**
 * PUT /api/hojas/:hoja_id/visible
 * Cambiar visibilidad de una hoja (toggle visible/oculta)
 * Acceso: Solo profesores asignados al aula
 */
router.put(
  '/:hoja_id/visible',
  autenticar,
  autorizarRoles('profesor'),
  [param('hoja_id').isUUID().withMessage('ID de hoja inválido')],
  cambiarVisibilidadHoja
);

module.exports = router;
