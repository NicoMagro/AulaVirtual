const { validationResult } = require('express-validator');
const db = require('../config/database');

// ============================================
// FUNCIONES PARA PROFESORES
// ============================================

/**
 * Establecer o actualizar clave de matriculación de un aula
 * Solo profesores asignados al aula
 */
const gestionarClaveMatriculacion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { aula_id, clave_matriculacion } = req.body;
    const profesor_id = req.usuario.id;

    // Verificar que el profesor está asignado al aula
    const profesorAsignado = await db.query(
      `SELECT * FROM aula_profesores
       WHERE aula_id = $1 AND profesor_id = $2 AND activo = true`,
      [aula_id, profesor_id]
    );

    if (profesorAsignado.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para gestionar esta aula',
      });
    }

    // Actualizar la clave de matriculación (null para aula pública)
    const resultado = await db.query(
      `UPDATE aulas
       SET clave_matriculacion = $1
       WHERE id = $2 AND activo = true
       RETURNING id, nombre, clave_matriculacion IS NOT NULL as requiere_clave`,
      [clave_matriculacion || null, aula_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aula no encontrada o inactiva',
      });
    }

    res.status(200).json({
      success: true,
      message: clave_matriculacion
        ? 'Clave de matriculación actualizada exitosamente'
        : 'Aula configurada como pública',
      data: resultado.rows[0],
    });

  } catch (error) {
    console.error('Error al gestionar clave de matriculación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al gestionar la clave de matriculación',
      error: error.message,
    });
  }
};

// ============================================
// FUNCIONES PARA ESTUDIANTES
// ============================================

/**
 * Listar aulas disponibles para matriculación
 * Incluye aulas públicas y aquellas donde ya está matriculado
 */
const listarAulasDisponibles = async (req, res) => {
  try {
    const estudiante_id = req.usuario.id;

    // Obtener aulas públicas (sin clave) o donde ya está matriculado
    const aulas = await db.query(
      `SELECT
        a.id,
        a.nombre,
        a.descripcion,
        a.capacidad_maxima,
        a.clave_matriculacion IS NOT NULL as requiere_clave,
        COUNT(DISTINCT ae.estudiante_id) FILTER (WHERE ae.activo = true) as estudiantes_actuales,
        EXISTS(
          SELECT 1 FROM aula_estudiantes
          WHERE aula_id = a.id AND estudiante_id = $1 AND activo = true
        ) as esta_matriculado,
        u.nombre || ' ' || u.apellido as creado_por
      FROM aulas a
      LEFT JOIN usuarios u ON a.creado_por = u.id
      LEFT JOIN aula_estudiantes ae ON a.id = ae.aula_id
      WHERE a.activo = true
      GROUP BY a.id, u.nombre, u.apellido
      ORDER BY a.fecha_creacion DESC`,
      [estudiante_id]
    );

    res.status(200).json({
      success: true,
      data: aulas.rows,
      total: aulas.rows.length,
    });

  } catch (error) {
    console.error('Error al listar aulas disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las aulas disponibles',
      error: error.message,
    });
  }
};

/**
 * Matricularse en un aula
 * Para aulas públicas no requiere clave
 * Para aulas privadas requiere la clave correcta
 */
const matricularseEnAula = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { aula_id, clave_matriculacion } = req.body;
    const estudiante_id = req.usuario.id;

    // Verificar que el aula existe y está activa
    const aulaResult = await db.query(
      'SELECT * FROM aulas WHERE id = $1 AND activo = true',
      [aula_id]
    );

    if (aulaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aula no encontrada o inactiva',
      });
    }

    const aula = aulaResult.rows[0];

    // Verificar si requiere clave y validarla
    if (aula.clave_matriculacion) {
      if (!clave_matriculacion) {
        return res.status(400).json({
          success: false,
          message: 'Esta aula requiere una clave de matriculación',
        });
      }

      if (clave_matriculacion !== aula.clave_matriculacion) {
        return res.status(401).json({
          success: false,
          message: 'Clave de matriculación incorrecta',
        });
      }
    }

    // Verificar capacidad del aula
    const cantidadEstudiantes = await db.query(
      'SELECT COUNT(*) as total FROM aula_estudiantes WHERE aula_id = $1 AND activo = true',
      [aula_id]
    );

    if (parseInt(cantidadEstudiantes.rows[0].total) >= aula.capacidad_maxima) {
      return res.status(400).json({
        success: false,
        message: 'El aula ha alcanzado su capacidad máxima',
      });
    }

    // Verificar si ya está matriculado
    const yaMatriculado = await db.query(
      'SELECT * FROM aula_estudiantes WHERE aula_id = $1 AND estudiante_id = $2',
      [aula_id, estudiante_id]
    );

    if (yaMatriculado.rows.length > 0) {
      // Si existe pero está inactivo, reactivarlo
      if (!yaMatriculado.rows[0].activo) {
        await db.query(
          `UPDATE aula_estudiantes
           SET activo = true, fecha_matriculacion = CURRENT_TIMESTAMP
           WHERE aula_id = $1 AND estudiante_id = $2`,
          [aula_id, estudiante_id]
        );

        return res.status(200).json({
          success: true,
          message: 'Te has matriculado nuevamente en el aula',
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Ya estás matriculado en esta aula',
      });
    }

    // Matricular al estudiante
    await db.query(
      'INSERT INTO aula_estudiantes (aula_id, estudiante_id) VALUES ($1, $2)',
      [aula_id, estudiante_id]
    );

    res.status(201).json({
      success: true,
      message: 'Te has matriculado exitosamente en el aula',
      data: {
        aula_id,
        aula_nombre: aula.nombre,
      },
    });

  } catch (error) {
    console.error('Error al matricularse en aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al matricularse en el aula',
      error: error.message,
    });
  }
};

/**
 * Listar aulas donde el estudiante está matriculado
 */
const misAulas = async (req, res) => {
  try {
    const estudiante_id = req.usuario.id;

    const aulas = await db.query(
      `SELECT
        a.id,
        a.nombre,
        a.descripcion,
        a.capacidad_maxima,
        ae.fecha_matriculacion,
        COUNT(DISTINCT ae2.estudiante_id) FILTER (WHERE ae2.activo = true) as total_estudiantes,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', u.id,
            'nombre', u.nombre,
            'apellido', u.apellido,
            'email', u.email
          )
        ) FILTER (WHERE u.id IS NOT NULL) as profesores
      FROM aula_estudiantes ae
      INNER JOIN aulas a ON ae.aula_id = a.id
      LEFT JOIN aula_estudiantes ae2 ON a.id = ae2.aula_id
      LEFT JOIN aula_profesores ap ON a.id = ap.aula_id AND ap.activo = true
      LEFT JOIN usuarios u ON ap.profesor_id = u.id
      WHERE ae.estudiante_id = $1 AND ae.activo = true AND a.activo = true
      GROUP BY a.id, ae.fecha_matriculacion
      ORDER BY ae.fecha_matriculacion DESC`,
      [estudiante_id]
    );

    res.status(200).json({
      success: true,
      data: aulas.rows,
      total: aulas.rows.length,
    });

  } catch (error) {
    console.error('Error al obtener mis aulas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus aulas',
      error: error.message,
    });
  }
};

/**
 * Desmatricularse de un aula
 */
const desmatricularseDeAula = async (req, res) => {
  try {
    const { aula_id } = req.params;
    const estudiante_id = req.usuario.id;

    const resultado = await db.query(
      `UPDATE aula_estudiantes
       SET activo = false
       WHERE aula_id = $1 AND estudiante_id = $2 AND activo = true
       RETURNING aula_id`,
      [aula_id, estudiante_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No estás matriculado en esta aula',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Te has desmatriculado del aula exitosamente',
    });

  } catch (error) {
    console.error('Error al desmatricularse de aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desmatricularse del aula',
      error: error.message,
    });
  }
};

/**
 * Obtener estudiantes de un aula (para profesores)
 */
const obtenerEstudiantesAula = async (req, res) => {
  try {
    const { aula_id } = req.params;
    const usuario_id = req.usuario.id;

    // Verificar que el usuario es profesor del aula
    const esProfesor = await db.query(
      `SELECT * FROM aula_profesores
       WHERE aula_id = $1 AND profesor_id = $2 AND activo = true`,
      [aula_id, usuario_id]
    );

    if (esProfesor.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver los estudiantes de esta aula',
      });
    }

    // Obtener estudiantes
    const estudiantes = await db.query(
      `SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        ae.fecha_matriculacion,
        ae.activo
      FROM aula_estudiantes ae
      INNER JOIN usuarios u ON ae.estudiante_id = u.id
      WHERE ae.aula_id = $1
      ORDER BY ae.fecha_matriculacion DESC`,
      [aula_id]
    );

    res.status(200).json({
      success: true,
      data: estudiantes.rows,
      total: estudiantes.rows.length,
    });

  } catch (error) {
    console.error('Error al obtener estudiantes del aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los estudiantes del aula',
      error: error.message,
    });
  }
};

module.exports = {
  // Profesores
  gestionarClaveMatriculacion,
  obtenerEstudiantesAula,

  // Estudiantes
  listarAulasDisponibles,
  matricularseEnAula,
  misAulas,
  desmatricularseDeAula,
};
