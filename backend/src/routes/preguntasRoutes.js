const express = require('express');
const { body, param } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  crearPregunta,
  obtenerPreguntasEvaluacion,
  obtenerPreguntaDetalle,
  actualizarPregunta,
  eliminarPregunta,
} = require('../controllers/preguntasController');

const router = express.Router();

// ============================================
// Validaciones
// ============================================

const validacionCrearPregunta = [
  body('evaluacion_id')
    .isUUID()
    .withMessage('ID de evaluación inválido'),
  body('tipo_pregunta')
    .isIn(['multiple_choice', 'verdadero_falso', 'verdadero_falso_justificacion', 'desarrollo'])
    .withMessage('Tipo de pregunta inválido'),
  body('enunciado')
    .notEmpty()
    .trim()
    .withMessage('El enunciado es obligatorio'),
  body('puntaje')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El puntaje debe ser un número positivo'),
  body('orden')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero positivo'),
  body('requiere_justificacion')
    .optional()
    .isBoolean()
    .withMessage('requiere_justificacion debe ser true o false'),
  body('opciones')
    .optional()
    .isArray()
    .withMessage('Las opciones deben ser un array'),
  body('opciones.*.texto')
    .optional()
    .notEmpty()
    .withMessage('El texto de la opción no puede estar vacío'),
  body('opciones.*.es_correcta')
    .optional()
    .isBoolean()
    .withMessage('es_correcta debe ser true o false'),
  body('respuesta_correcta')
    .optional()
    .isBoolean()
    .withMessage('respuesta_correcta debe ser true o false'),
];

const validacionActualizarPregunta = [
  param('pregunta_id')
    .isUUID()
    .withMessage('ID de pregunta inválido'),
  body('enunciado')
    .optional()
    .notEmpty()
    .trim()
    .withMessage('El enunciado no puede estar vacío'),
  body('puntaje')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El puntaje debe ser un número positivo'),
  body('orden')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero positivo'),
  body('requiere_justificacion')
    .optional()
    .isBoolean()
    .withMessage('requiere_justificacion debe ser true o false'),
  body('opciones')
    .optional()
    .isArray()
    .withMessage('Las opciones deben ser un array'),
  body('opciones.*.texto')
    .optional()
    .notEmpty()
    .withMessage('El texto de la opción no puede estar vacío'),
  body('opciones.*.es_correcta')
    .optional()
    .isBoolean()
    .withMessage('es_correcta debe ser true o false'),
  body('respuesta_correcta')
    .optional()
    .isBoolean()
    .withMessage('respuesta_correcta debe ser true o false'),
];

const validacionPreguntaId = [
  param('pregunta_id')
    .isUUID()
    .withMessage('ID de pregunta inválido'),
];

const validacionEvaluacionId = [
  param('evaluacion_id')
    .isUUID()
    .withMessage('ID de evaluación inválido'),
];

// ============================================
// Rutas
// ============================================

/**
 * POST /api/preguntas
 * Crear una nueva pregunta en el banco de una evaluación
 * Acceso: Profesores asignados al aula
 */
router.post(
  '/',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionCrearPregunta,
  crearPregunta
);

/**
 * GET /api/preguntas/evaluacion/:evaluacion_id
 * Obtener todas las preguntas de una evaluación
 * Acceso: Profesores asignados al aula
 */
router.get(
  '/evaluacion/:evaluacion_id',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionEvaluacionId,
  obtenerPreguntasEvaluacion
);

/**
 * GET /api/preguntas/:pregunta_id
 * Obtener detalle de una pregunta específica
 * Acceso: Profesores asignados al aula
 */
router.get(
  '/:pregunta_id',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionPreguntaId,
  obtenerPreguntaDetalle
);

/**
 * PUT /api/preguntas/:pregunta_id
 * Actualizar una pregunta
 * Acceso: Profesores asignados al aula
 */
router.put(
  '/:pregunta_id',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionActualizarPregunta,
  actualizarPregunta
);

/**
 * DELETE /api/preguntas/:pregunta_id
 * Eliminar una pregunta
 * Acceso: Profesores asignados al aula
 */
router.delete(
  '/:pregunta_id',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionPreguntaId,
  eliminarPregunta
);

module.exports = router;
