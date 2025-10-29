const express = require('express');
const { body, param } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  iniciarIntento,
  obtenerIntento,
  guardarRespuesta,
  entregarIntento,
  obtenerMisIntentos,
  obtenerIntentosPendientes,
  obtenerIntentoParaCalificar,
  calificarRespuesta,
  publicarResultados,
} = require('../controllers/intentosController');

const router = express.Router();

// ============================================
// Validaciones
// ============================================

const validacionIniciarIntento = [
  body('evaluacion_id')
    .isUUID()
    .withMessage('ID de evaluación inválido'),
];

const validacionGuardarRespuesta = [
  param('intento_id')
    .isUUID()
    .withMessage('ID de intento inválido'),
  body('pregunta_id')
    .isUUID()
    .withMessage('ID de pregunta inválido'),
  body('opcion_seleccionada_id')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID de opción inválido'),
  body('respuesta_booleana')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('respuesta_booleana debe ser true o false'),
  body('respuesta_texto')
    .optional({ nullable: true })
    .trim(),
  body('justificacion')
    .optional({ nullable: true })
    .trim(),
];

const validacionIntentoId = [
  param('intento_id')
    .isUUID()
    .withMessage('ID de intento inválido'),
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
 * POST /api/intentos/iniciar
 * Iniciar un nuevo intento de evaluación
 * Acceso: Estudiantes matriculados en el aula
 */
router.post(
  '/iniciar',
  autenticar,
  autorizarRoles('estudiante'),
  validacionIniciarIntento,
  iniciarIntento
);

/**
 * GET /api/intentos/:intento_id
 * Obtener detalles de un intento con sus preguntas
 * Acceso: Estudiante dueño del intento o profesores del aula
 */
router.get(
  '/:intento_id',
  autenticar,
  validacionIntentoId,
  obtenerIntento
);

/**
 * POST /api/intentos/:intento_id/respuesta
 * Guardar respuesta de una pregunta
 * Acceso: Estudiante dueño del intento
 */
router.post(
  '/:intento_id/respuesta',
  autenticar,
  autorizarRoles('estudiante'),
  validacionGuardarRespuesta,
  guardarRespuesta
);

/**
 * POST /api/intentos/:intento_id/entregar
 * Entregar el intento
 * Acceso: Estudiante dueño del intento
 */
router.post(
  '/:intento_id/entregar',
  autenticar,
  autorizarRoles('estudiante'),
  validacionIntentoId,
  entregarIntento
);

/**
 * GET /api/intentos/evaluacion/:evaluacion_id/mis-intentos
 * Obtener todos los intentos del estudiante en una evaluación
 * Acceso: Estudiante
 */
router.get(
  '/evaluacion/:evaluacion_id/mis-intentos',
  autenticar,
  autorizarRoles('estudiante'),
  validacionEvaluacionId,
  obtenerMisIntentos
);

/**
 * GET /api/intentos/evaluacion/:evaluacion_id/pendientes
 * Obtener intentos pendientes de calificación de una evaluación
 * Acceso: Profesores del aula
 */
router.get(
  '/evaluacion/:evaluacion_id/pendientes',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionEvaluacionId,
  obtenerIntentosPendientes
);

/**
 * GET /api/intentos/:intento_id/calificar
 * Obtener intento con todas las respuestas para calificar
 * Acceso: Profesores del aula
 */
router.get(
  '/:intento_id/calificar',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionIntentoId,
  obtenerIntentoParaCalificar
);

/**
 * PUT /api/intentos/:intento_id/respuesta/:respuesta_id/calificar
 * Calificar una respuesta individual
 * Acceso: Profesores del aula
 */
router.put(
  '/:intento_id/respuesta/:respuesta_id/calificar',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  [
    param('intento_id').isUUID().withMessage('ID de intento inválido'),
    param('respuesta_id').isUUID().withMessage('ID de respuesta inválido'),
    body('puntaje_obtenido')
      .isFloat({ min: 0 })
      .withMessage('Puntaje debe ser un número positivo'),
    body('retroalimentacion').optional().trim(),
  ],
  calificarRespuesta
);

/**
 * POST /api/intentos/:intento_id/publicar
 * Publicar resultados del intento (recalcular nota y cambiar estado a 'calificado')
 * Acceso: Profesores del aula
 */
router.post(
  '/:intento_id/publicar',
  autenticar,
  autorizarRoles('profesor', 'admin'),
  validacionIntentoId,
  publicarResultados
);

module.exports = router;
