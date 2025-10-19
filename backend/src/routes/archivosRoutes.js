const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  subirArchivoMiddleware,
  subirArchivo,
  obtenerArchivosAula,
  descargarArchivo,
  eliminarArchivo,
  cambiarVisibilidadArchivo,
} = require('../controllers/archivosController');

/**
 * POST /api/archivos/subir
 * Subir un archivo al aula
 * Solo profesores
 */
router.post(
  '/subir',
  autenticar,
  autorizarRoles('profesor'),
  subirArchivoMiddleware,
  [
    body('aula_id')
      .isUUID()
      .withMessage('ID de aula inválido'),
    body('hoja_id')
      .isUUID()
      .withMessage('ID de hoja inválido'),
    body('descripcion')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
  ],
  subirArchivo
);

/**
 * GET /api/archivos/aula/:aula_id
 * Obtener archivos de una hoja de aula
 * Requiere query param: hoja_id (opcional, si no se proporciona trae todos los archivos del aula)
 * Accesible por profesores y estudiantes matriculados
 */
router.get(
  '/aula/:aula_id',
  autenticar,
  [
    param('aula_id')
      .isUUID()
      .withMessage('ID de aula inválido'),
    query('hoja_id')
      .optional()
      .isUUID()
      .withMessage('ID de hoja inválido'),
  ],
  obtenerArchivosAula
);

/**
 * GET /api/archivos/descargar/:archivo_id
 * Descargar un archivo
 * Accesible por profesores y estudiantes matriculados (solo si visible)
 */
router.get(
  '/descargar/:archivo_id',
  autenticar,
  [
    param('archivo_id')
      .isUUID()
      .withMessage('ID de archivo inválido'),
  ],
  descargarArchivo
);

/**
 * DELETE /api/archivos/:archivo_id
 * Eliminar un archivo
 * Solo profesores asignados al aula
 */
router.delete(
  '/:archivo_id',
  autenticar,
  autorizarRoles('profesor'),
  [
    param('archivo_id')
      .isUUID()
      .withMessage('ID de archivo inválido'),
  ],
  eliminarArchivo
);

/**
 * PUT /api/archivos/:archivo_id/visible
 * Cambiar visibilidad de un archivo (toggle)
 * Solo profesores asignados al aula
 */
router.put(
  '/:archivo_id/visible',
  autenticar,
  autorizarRoles('profesor'),
  [
    param('archivo_id')
      .isUUID()
      .withMessage('ID de archivo inválido'),
  ],
  cambiarVisibilidadArchivo
);

module.exports = router;
