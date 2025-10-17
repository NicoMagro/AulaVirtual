const { validationResult } = require('express-validator');
const db = require('../config/database');

/**
 * Crear una nueva aula (solo administradores)
 */
const crearAula = async (req, res) => {
  try {
    // Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { nombre, descripcion, capacidad_maxima } = req.body;
    const creado_por = req.usuario.id; // Del middleware de autenticación

    // Verificar que el nombre no esté duplicado
    const aulaExiste = await db.query(
      'SELECT id FROM aulas WHERE nombre = $1',
      [nombre]
    );

    if (aulaExiste.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un aula con ese nombre',
      });
    }

    // Crear el aula
    const nuevaAula = await db.query(
      `INSERT INTO aulas (nombre, descripcion, capacidad_maxima, creado_por)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, descripcion, capacidad_maxima, activo, fecha_creacion`,
      [nombre, descripcion || null, capacidad_maxima || 30, creado_por]
    );

    res.status(201).json({
      success: true,
      message: 'Aula creada exitosamente',
      data: nuevaAula.rows[0],
    });

  } catch (error) {
    console.error('Error al crear aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el aula',
      error: error.message,
    });
  }
};

/**
 * Listar todas las aulas
 */
const listarAulas = async (req, res) => {
  try {
    const { activo } = req.query;

    let query = `
      SELECT
        a.id,
        a.nombre,
        a.descripcion,
        a.capacidad_maxima,
        a.clave_matriculacion IS NOT NULL as requiere_clave,
        a.activo,
        a.fecha_creacion,
        a.fecha_actualizacion,
        u.nombre || ' ' || u.apellido as creado_por_nombre,
        COUNT(DISTINCT ap.profesor_id) FILTER (WHERE ap.activo = true) as total_profesores,
        COUNT(DISTINCT ae.estudiante_id) FILTER (WHERE ae.activo = true) as total_estudiantes
      FROM aulas a
      LEFT JOIN usuarios u ON a.creado_por = u.id
      LEFT JOIN aula_profesores ap ON a.id = ap.aula_id
      LEFT JOIN aula_estudiantes ae ON a.id = ae.aula_id
    `;

    const params = [];
    if (activo !== undefined) {
      query += ' WHERE a.activo = $1';
      params.push(activo === 'true');
    }

    query += ' GROUP BY a.id, u.nombre, u.apellido ORDER BY a.fecha_creacion DESC';

    const aulas = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: aulas.rows,
      total: aulas.rows.length,
    });

  } catch (error) {
    console.error('Error al listar aulas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las aulas',
      error: error.message,
    });
  }
};

/**
 * Obtener un aula por ID
 */
const obtenerAula = async (req, res) => {
  try {
    const { id } = req.params;

    const aula = await db.query(
      `SELECT
        a.id,
        a.nombre,
        a.descripcion,
        a.capacidad_maxima,
        a.clave_matriculacion IS NOT NULL as requiere_clave,
        a.activo,
        a.fecha_creacion,
        a.fecha_actualizacion,
        u.nombre || ' ' || u.apellido as creado_por_nombre
      FROM aulas a
      LEFT JOIN usuarios u ON a.creado_por = u.id
      WHERE a.id = $1`,
      [id]
    );

    if (aula.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aula no encontrada',
      });
    }

    // Obtener profesores asignados
    const profesores = await db.query(
      `SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        ap.asignado_en,
        ap.activo
      FROM aula_profesores ap
      INNER JOIN usuarios u ON ap.profesor_id = u.id
      WHERE ap.aula_id = $1 AND ap.activo = true`,
      [id]
    );

    // Obtener conteo de estudiantes
    const estudiantes = await db.query(
      `SELECT COUNT(*) as total
       FROM aula_estudiantes
       WHERE aula_id = $1 AND activo = true`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...aula.rows[0],
        profesores: profesores.rows,
        total_estudiantes: parseInt(estudiantes.rows[0].total),
      },
    });

  } catch (error) {
    console.error('Error al obtener aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el aula',
      error: error.message,
    });
  }
};

/**
 * Actualizar un aula (solo administradores)
 */
const actualizarAula = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { nombre, descripcion, capacidad_maxima, activo } = req.body;

    // Verificar que el aula existe
    const aulaExiste = await db.query('SELECT id FROM aulas WHERE id = $1', [id]);

    if (aulaExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aula no encontrada',
      });
    }

    // Si se actualiza el nombre, verificar que no esté duplicado
    if (nombre) {
      const nombreDuplicado = await db.query(
        'SELECT id FROM aulas WHERE nombre = $1 AND id != $2',
        [nombre, id]
      );

      if (nombreDuplicado.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe otra aula con ese nombre',
        });
      }
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCount}`);
      values.push(nombre);
      paramCount++;
    }

    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount}`);
      values.push(descripcion);
      paramCount++;
    }

    if (capacidad_maxima !== undefined) {
      updates.push(`capacidad_maxima = $${paramCount}`);
      values.push(capacidad_maxima);
      paramCount++;
    }

    if (activo !== undefined) {
      updates.push(`activo = $${paramCount}`);
      values.push(activo);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar',
      });
    }

    values.push(id);

    const aulaActualizada = await db.query(
      `UPDATE aulas
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, nombre, descripcion, capacidad_maxima, activo, fecha_actualizacion`,
      values
    );

    res.status(200).json({
      success: true,
      message: 'Aula actualizada exitosamente',
      data: aulaActualizada.rows[0],
    });

  } catch (error) {
    console.error('Error al actualizar aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el aula',
      error: error.message,
    });
  }
};

/**
 * Eliminar (desactivar) un aula (solo administradores)
 */
const eliminarAula = async (req, res) => {
  try {
    const { id } = req.params;

    const aula = await db.query(
      'UPDATE aulas SET activo = false WHERE id = $1 RETURNING id, nombre',
      [id]
    );

    if (aula.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aula no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Aula desactivada exitosamente',
      data: aula.rows[0],
    });

  } catch (error) {
    console.error('Error al eliminar aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el aula',
      error: error.message,
    });
  }
};

/**
 * Asignar un profesor a un aula (solo administradores)
 */
const asignarProfesor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { aula_id, profesor_id } = req.body;
    const asignado_por = req.usuario.id;

    // Verificar que el aula existe
    const aulaExiste = await db.query(
      'SELECT id FROM aulas WHERE id = $1 AND activo = true',
      [aula_id]
    );

    if (aulaExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aula no encontrada o inactiva',
      });
    }

    // Verificar que el usuario es profesor
    const esProfesor = await db.query(
      `SELECT u.id
       FROM usuarios u
       INNER JOIN usuario_roles ur ON u.id = ur.usuario_id
       INNER JOIN roles r ON ur.rol_id = r.id
       WHERE u.id = $1 AND r.nombre = 'profesor' AND u.activo = true`,
      [profesor_id]
    );

    if (esProfesor.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es un profesor válido o está inactivo',
      });
    }

    // Verificar si ya está asignado
    const yaAsignado = await db.query(
      'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2',
      [aula_id, profesor_id]
    );

    if (yaAsignado.rows.length > 0) {
      // Si existe pero está inactivo, reactivarlo
      if (!yaAsignado.rows[0].activo) {
        await db.query(
          'UPDATE aula_profesores SET activo = true, asignado_por = $1, asignado_en = CURRENT_TIMESTAMP WHERE aula_id = $2 AND profesor_id = $3',
          [asignado_por, aula_id, profesor_id]
        );

        return res.status(200).json({
          success: true,
          message: 'Profesor reasignado al aula exitosamente',
        });
      }

      return res.status(409).json({
        success: false,
        message: 'El profesor ya está asignado a esta aula',
      });
    }

    // Asignar el profesor al aula
    await db.query(
      `INSERT INTO aula_profesores (aula_id, profesor_id, asignado_por)
       VALUES ($1, $2, $3)`,
      [aula_id, profesor_id, asignado_por]
    );

    res.status(201).json({
      success: true,
      message: 'Profesor asignado al aula exitosamente',
    });

  } catch (error) {
    console.error('Error al asignar profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar el profesor',
      error: error.message,
    });
  }
};

/**
 * Desasignar un profesor de un aula (solo administradores)
 */
const desasignarProfesor = async (req, res) => {
  try {
    const { aula_id, profesor_id } = req.params;

    const resultado = await db.query(
      'UPDATE aula_profesores SET activo = false WHERE aula_id = $1 AND profesor_id = $2 RETURNING *',
      [aula_id, profesor_id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profesor desasignado del aula exitosamente',
    });

  } catch (error) {
    console.error('Error al desasignar profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desasignar el profesor',
      error: error.message,
    });
  }
};

/**
 * Listar aulas donde el profesor está asignado
 */
const misAulasProfesor = async (req, res) => {
  try {
    const profesor_id = req.usuario.id;

    const aulas = await db.query(
      `SELECT
        a.id,
        a.nombre,
        a.descripcion,
        a.capacidad_maxima,
        a.clave_matriculacion IS NOT NULL as requiere_clave,
        a.activo,
        a.fecha_creacion,
        a.fecha_actualizacion,
        COUNT(DISTINCT ae.estudiante_id) FILTER (WHERE ae.activo = true) as total_estudiantes,
        ap.asignado_en
      FROM aulas a
      INNER JOIN aula_profesores ap ON a.id = ap.aula_id
      LEFT JOIN aula_estudiantes ae ON a.id = ae.aula_id
      WHERE ap.profesor_id = $1 AND ap.activo = true AND a.activo = true
      GROUP BY a.id, ap.asignado_en
      ORDER BY a.nombre ASC`,
      [profesor_id]
    );

    res.status(200).json({
      success: true,
      data: aulas.rows,
      total: aulas.rows.length,
    });

  } catch (error) {
    console.error('Error al obtener aulas del profesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las aulas',
      error: error.message,
    });
  }
};

module.exports = {
  crearAula,
  listarAulas,
  obtenerAula,
  actualizarAula,
  eliminarAula,
  asignarProfesor,
  desasignarProfesor,
  misAulasProfesor,
};
