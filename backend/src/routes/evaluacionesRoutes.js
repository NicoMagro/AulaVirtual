const express = require('express');
const { body, param } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  crearEvaluacion,
  obtenerEvaluacionesAula,
  obtenerEvaluacionDetalle,
  actualizarEvaluacion,
  eliminarEvaluacion,
  obtenerEstadisticas,
} = require('../controllers/evaluacionesController');

const router = express.Router();

// ============================================
// Validaciones
// ============================================

const validacionCrearEvaluacion = [
  body('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('titulo')
    .notEmpty()
    .trim()
    .withMessage('El título es obligatorio')
    .isLength({ max: 200 })
    .withMessage('El título no puede exceder 200 caracteres'),
  body('hoja_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID de hoja inválido'),
  body('descripcion')
    .optional({ nullable: true })
    .trim(),
  body('nota_minima_aprobacion')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('La nota mínima debe estar entre 0 y 10'),
  body('fecha_inicio')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('fecha_fin')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  body('duracion_maxima_minutos')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('La duración debe ser un número positivo'),
  body('intentos_permitidos')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Los intentos permitidos deben ser al menos 1'),
  body('cantidad_preguntas_mostrar')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La cantidad de preguntas a mostrar debe ser al menos 1'),
  body('orden_aleatorio')
    .optional()
    .isBoolean()
    .withMessage('orden_aleatorio debe ser true o false'),
  body('mostrar_respuestas_correctas')
    .optional()
    .isBoolean()
    .withMessage('mostrar_respuestas_correctas debe ser true o false'),
];

const validacionActualizarEvaluacion = [
  param('evaluacion_id')
    .isUUID()
    .withMessage('ID de evaluación inválido'),
  body('titulo')
    .optional()
    .notEmpty()
    .trim()
    .withMessage('El título no puede estar vacío')
    .isLength({ max: 200 })
    .withMessage('El título no puede exceder 200 caracteres'),
  body('descripcion')
    .optional({ nullable: true })
    .trim(),
  body('nota_minima_aprobacion')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('La nota mínima debe estar entre 0 y 10'),
  body('fecha_inicio')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('fecha_fin')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  body('duracion_maxima_minutos')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('La duración debe ser un número positivo'),
  body('intentos_permitidos')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Los intentos permitidos deben ser al menos 1'),
  body('cantidad_preguntas_mostrar')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La cantidad de preguntas a mostrar debe ser al menos 1'),
  body('orden_aleatorio')
    .optional()
    .isBoolean()
    .withMessage('orden_aleatorio debe ser true o false'),
  body('mostrar_respuestas_correctas')
    .optional()
    .isBoolean()
    .withMessage('mostrar_respuestas_correctas debe ser true o false'),
  body('estado')
    .optional()
    .isIn(['borrador', 'publicado', 'cerrado'])
    .withMessage('Estado inválido'),
];

const validacionEvaluacionId = [
  param('evaluacion_id')
    .isUUID()
    .withMessage('ID de evaluación inválido'),
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
 * POST /api/evaluaciones
 * Crear una nueva evaluación
 * Acceso: Profesores asignados al aula
 */
router.post(
  '/',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionCrearEvaluacion,
  crearEvaluacion
);

/**
 * GET /api/evaluaciones/aula/:aula_id
 * Obtener todas las evaluaciones de un aula
 * Acceso: Profesores, estudiantes y admin con acceso al aula
 */
router.get(
  '/aula/:aula_id',
  autenticar,
  validacionAulaId,
  obtenerEvaluacionesAula
);

/**
 * GET /api/evaluaciones/:evaluacion_id
 * Obtener detalle de una evaluación específica
 * Acceso: Profesores, estudiantes y admin con acceso al aula
 */
router.get(
  '/:evaluacion_id',
  autenticar,
  validacionEvaluacionId,
  obtenerEvaluacionDetalle
);

/**
 * PUT /api/evaluaciones/:evaluacion_id
 * Actualizar una evaluación
 * Acceso: Profesores asignados al aula
 */
router.put(
  '/:evaluacion_id',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionActualizarEvaluacion,
  actualizarEvaluacion
);

/**
 * GET /api/evaluaciones/:evaluacion_id/estadisticas
 * Obtener estadísticas de una evaluación
 * Acceso: Profesores asignados al aula y admin
 */
router.get(
  '/:evaluacion_id/estadisticas',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionEvaluacionId,
  obtenerEstadisticas
);

/**
 * DELETE /api/evaluaciones/:evaluacion_id
 * Eliminar una evaluación
 * Acceso: Profesores asignados al aula y admin
 */
router.delete(
  '/:evaluacion_id',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionEvaluacionId,
  eliminarEvaluacion
);

module.exports = router;
