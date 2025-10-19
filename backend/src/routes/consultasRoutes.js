const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { autenticar } = require('../middlewares/auth');
const {
  crearConsulta,
  obtenerConsultasAula,
  obtenerConsultaDetalle,
  crearRespuesta,
  marcarComoResuelta,
  eliminarConsulta,
  eliminarRespuesta,
} = require('../controllers/consultasController');

/**
 * POST /api/consultas
 * Crear una nueva consulta
 * Accesible por estudiantes y profesores del aula
 */
router.post(
  '/',
  autenticar,
  [
    body('aula_id')
      .isUUID()
      .withMessage('ID de aula inválido'),
    body('titulo')
      .trim()
      .notEmpty()
      .withMessage('El título es requerido')
      .isLength({ max: 255 })
      .withMessage('El título no puede exceder 255 caracteres'),
    body('pregunta')
      .trim()
      .notEmpty()
      .withMessage('La pregunta es requerida'),
    body('publica')
      .optional()
      .isBoolean()
      .withMessage('El campo publica debe ser booleano'),
    body('hoja_id')
      .optional()
      .isUUID()
      .withMessage('ID de hoja inválido'),
    body('bloque_id')
      .optional()
      .isUUID()
      .withMessage('ID de bloque inválido'),
    body('archivo_id')
      .optional()
      .isUUID()
      .withMessage('ID de archivo inválido'),
  ],
  crearConsulta
);

/**
 * GET /api/consultas/aula/:aula_id
 * Obtener todas las consultas de un aula
 * Accesible por profesores y estudiantes del aula
 */
router.get(
  '/aula/:aula_id',
  autenticar,
  [
    param('aula_id')
      .isUUID()
      .withMessage('ID de aula inválido'),
  ],
  obtenerConsultasAula
);

/**
 * GET /api/consultas/:consulta_id
 * Obtener detalle de una consulta con sus respuestas
 * Accesible por profesores y estudiantes del aula
 */
router.get(
  '/:consulta_id',
  autenticar,
  [
    param('consulta_id')
      .isUUID()
      .withMessage('ID de consulta inválido'),
  ],
  obtenerConsultaDetalle
);

/**
 * POST /api/consultas/:consulta_id/respuestas
 * Crear una respuesta a una consulta
 * Si la consulta es privada, solo profesores pueden responder
 * Si es pública, tanto estudiantes como profesores pueden responder
 */
router.post(
  '/:consulta_id/respuestas',
  autenticar,
  [
    param('consulta_id')
      .isUUID()
      .withMessage('ID de consulta inválido'),
    body('respuesta')
      .trim()
      .notEmpty()
      .withMessage('La respuesta es requerida'),
  ],
  crearRespuesta
);

/**
 * PUT /api/consultas/:consulta_id/resuelta
 * Marcar una consulta como resuelta (toggle)
 * Solo el creador de la consulta puede marcarla como resuelta
 */
router.put(
  '/:consulta_id/resuelta',
  autenticar,
  [
    param('consulta_id')
      .isUUID()
      .withMessage('ID de consulta inválido'),
  ],
  marcarComoResuelta
);

/**
 * DELETE /api/consultas/:consulta_id
 * Eliminar una consulta
 * Solo el creador o profesores del aula pueden eliminar
 */
router.delete(
  '/:consulta_id',
  autenticar,
  [
    param('consulta_id')
      .isUUID()
      .withMessage('ID de consulta inválido'),
  ],
  eliminarConsulta
);

/**
 * DELETE /api/consultas/respuestas/:respuesta_id
 * Eliminar una respuesta
 * Solo el autor de la respuesta o profesores del aula pueden eliminar
 */
router.delete(
  '/respuestas/:respuesta_id',
  autenticar,
  [
    param('respuesta_id')
      .isUUID()
      .withMessage('ID de respuesta inválido'),
  ],
  eliminarRespuesta
);

module.exports = router;
