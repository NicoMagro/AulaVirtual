const express = require('express');
const { body, param } = require('express-validator');
const { autenticar, autorizarRoles } = require('../middlewares/auth');
const {
  gestionarClaveMatriculacion,
  obtenerEstudiantesAula,
  listarAulasDisponibles,
  matricularseEnAula,
  misAulas,
  desmatricularseDeAula,
} = require('../controllers/matriculacionController');

const router = express.Router();

// ============================================
// Validaciones
// ============================================

const validacionGestionarClave = [
  body('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('clave_matriculacion')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 4, max: 255 })
    .withMessage('La clave debe tener entre 4 y 255 caracteres'),
];

const validacionMatriculacion = [
  body('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
  body('clave_matriculacion')
    .optional({ nullable: true })
    .isString()
    .withMessage('La clave debe ser una cadena de texto'),
];

const validacionIdAula = [
  param('aula_id')
    .isUUID()
    .withMessage('ID de aula inválido'),
];

// ============================================
// Rutas para PROFESORES
// ============================================

/**
 * PUT /api/matriculacion/aula/clave
 * Gestionar clave de matriculación de un aula
 * Acceso: Profesores asignados al aula
 */
router.put(
  '/aula/clave',
  autenticar,
  autorizarRoles('profesor'),
  validacionGestionarClave,
  gestionarClaveMatriculacion
);

/**
 * GET /api/matriculacion/aula/:aula_id/estudiantes
 * Obtener lista de estudiantes de un aula
 * Acceso: Profesores asignados al aula
 */
router.get(
  '/aula/:aula_id/estudiantes',
  autenticar,
  autorizarRoles('profesor'),
  validacionIdAula,
  obtenerEstudiantesAula
);

// ============================================
// Rutas para ESTUDIANTES
// ============================================

/**
 * GET /api/matriculacion/aulas-disponibles
 * Listar aulas disponibles para matriculación
 * Acceso: Estudiantes
 */
router.get(
  '/aulas-disponibles',
  autenticar,
  autorizarRoles('estudiante'),
  listarAulasDisponibles
);

/**
 * POST /api/matriculacion/matricularse
 * Matricularse en un aula
 * Acceso: Estudiantes
 */
router.post(
  '/matricularse',
  autenticar,
  autorizarRoles('estudiante'),
  validacionMatriculacion,
  matricularseEnAula
);

/**
 * GET /api/matriculacion/mis-aulas
 * Listar aulas donde el estudiante está matriculado
 * Acceso: Estudiantes
 */
router.get(
  '/mis-aulas',
  autenticar,
  autorizarRoles('estudiante'),
  misAulas
);

/**
 * DELETE /api/matriculacion/desmatricularse/:aula_id
 * Desmatricularse de un aula
 * Acceso: Estudiantes
 */
router.delete(
  '/desmatricularse/:aula_id',
  autenticar,
  autorizarRoles('estudiante'),
  validacionIdAula,
  desmatricularseDeAula
);

module.exports = router;
