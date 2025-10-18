const express = require('express');
const { body, param } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  obtenerContenidoAula,
  crearBloque,
  actualizarBloque,
  eliminarBloque,
  reordenarBloques,
} = require('../controllers/contenidoController');

const router = express.Router();

// ============================================
// Validaciones
// ============================================

const validacionCrearBloque = [
  body('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('tipo')
    .isIn(['titulo', 'subtitulo', 'parrafo', 'lista', 'enlace', 'separador'])
    .withMessage('Tipo de bloque inválido'),
  body('contenido')
    .notEmpty()
    .trim()
    .withMessage('El contenido no puede estar vacío'),
  body('orden')
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero positivo'),
];

const validacionActualizarBloque = [
  param('bloque_id')
    .isUUID()
    .withMessage('ID de bloque inválido'),
  body('tipo')
    .isIn(['titulo', 'subtitulo', 'parrafo', 'lista', 'enlace', 'separador'])
    .withMessage('Tipo de bloque inválido'),
  body('contenido')
    .notEmpty()
    .trim()
    .withMessage('El contenido no puede estar vacío'),
  body('orden')
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero positivo'),
];

const validacionEliminarBloque = [
  param('bloque_id')
    .isUUID()
    .withMessage('ID de bloque inválido'),
];

const validacionReordenar = [
  body('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('bloques')
    .isArray({ min: 1 })
    .withMessage('Debe proporcionar al menos un bloque'),
  body('bloques.*.id')
    .isUUID()
    .withMessage('ID de bloque inválido'),
  body('bloques.*.orden')
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
 * GET /api/contenido/aula/:aula_id
 * Obtener todo el contenido de un aula
 * Acceso: Profesores y estudiantes con acceso al aula
 */
router.get(
  '/aula/:aula_id',
  autenticar,
  validacionAulaId,
  obtenerContenidoAula
);

/**
 * POST /api/contenido/bloque
 * Crear un nuevo bloque de contenido
 * Acceso: Solo profesores asignados al aula
 */
router.post(
  '/bloque',
  autenticar,
  autorizarRoles('profesor'),
  validacionCrearBloque,
  crearBloque
);

/**
 * PUT /api/contenido/bloque/:bloque_id
 * Actualizar un bloque de contenido
 * Acceso: Solo profesores asignados al aula
 */
router.put(
  '/bloque/:bloque_id',
  autenticar,
  autorizarRoles('profesor'),
  validacionActualizarBloque,
  actualizarBloque
);

/**
 * DELETE /api/contenido/bloque/:bloque_id
 * Eliminar un bloque de contenido
 * Acceso: Solo profesores asignados al aula
 */
router.delete(
  '/bloque/:bloque_id',
  autenticar,
  autorizarRoles('profesor'),
  validacionEliminarBloque,
  eliminarBloque
);

/**
 * PUT /api/contenido/reordenar
 * Reordenar bloques de contenido
 * Acceso: Solo profesores asignados al aula
 */
router.put(
  '/reordenar',
  autenticar,
  autorizarRoles('profesor'),
  validacionReordenar,
  reordenarBloques
);

module.exports = router;
