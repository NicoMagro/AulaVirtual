const { validationResult } = require('express-validator');
const db = require('../config/database');

/**
 * Obtener todas las hojas de un aula ordenadas
 * Accesible por profesores asignados, estudiantes matriculados y admin
 */
const obtenerHojasAula = async (req, res) => {
  try {
    const { aula_id } = req.params;
    const usuario_id = req.usuario.id;
    const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

    // Verificar que el usuario tiene acceso al aula
    let tieneAcceso = false;

    if (rol_activo === 'admin') {
      tieneAcceso = true;
    } else if (rol_activo === 'profesor') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [aula_id, usuario_id]
      );
      tieneAcceso = esProfesor.rows.length > 0;
    } else if (rol_activo === 'estudiante') {
      const esEstudiante = await db.query(
        'SELECT * FROM aula_estudiantes WHERE aula_id = $1 AND estudiante_id = $2 AND activo = true',
        [aula_id, usuario_id]
      );
      tieneAcceso = esEstudiante.rows.length > 0;
    }

    if (!tieneAcceso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta aula',
      });
    }

    // Obtener las hojas ordenadas
    // Profesores y admins ven todas las hojas, estudiantes solo las visibles
    let query = `SELECT
      id,
      nombre,
      orden,
      visible,
      fecha_creacion,
      fecha_actualizacion
    FROM hojas_aula
    WHERE aula_id = $1 AND activo = true`;

    // Si es estudiante, filtrar solo hojas visibles
    if (rol_activo === 'estudiante') {
      query += ' AND visible = true';
    }

    query += ' ORDER BY orden ASC';

    const hojas = await db.query(query, [aula_id]);

    res.status(200).json({
      success: true,
      data: hojas.rows,
      total: hojas.rows.length,
    });

  } catch (error) {
    console.error('Error al obtener hojas del aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las hojas del aula',
      error: error.message,
    });
  }
};

/**
 * Crear una nueva hoja en un aula
 * Solo profesores asignados al aula
 */
const crearHoja = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { aula_id, nombre, orden } = req.body;
    const usuario_id = req.usuario.id;

    // Verificar que el usuario es profesor del aula
    const esProfesor = await db.query(
      'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
      [aula_id, usuario_id]
    );

    if (esProfesor.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta aula',
      });
    }

    // Verificar que no exista una hoja con el mismo nombre en el aula
    const hojaExistente = await db.query(
      'SELECT * FROM hojas_aula WHERE aula_id = $1 AND nombre = $2 AND activo = true',
      [aula_id, nombre]
    );

    if (hojaExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una hoja con ese nombre en esta aula',
      });
    }

    // Crear la hoja
    const resultado = await db.query(
      `INSERT INTO hojas_aula (aula_id, nombre, orden, creado_por)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [aula_id, nombre, orden, usuario_id]
    );

    res.status(201).json({
      success: true,
      message: 'Hoja creada exitosamente',
      data: resultado.rows[0],
    });

  } catch (error) {
    console.error('Error al crear hoja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la hoja',
      error: error.message,
    });
  }
};

/**
 * Actualizar una hoja existente
 * Solo profesores asignados al aula
 */
const actualizarHoja = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { hoja_id } = req.params;
    const { nombre, orden } = req.body;
    const usuario_id = req.usuario.id;

    // Obtener el aula_id de la hoja
    const hojaActual = await db.query(
      'SELECT aula_id FROM hojas_aula WHERE id = $1',
      [hoja_id]
    );

    if (hojaActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hoja no encontrada',
      });
    }

    const aula_id = hojaActual.rows[0].aula_id;

    // Verificar que el usuario es profesor del aula
    const esProfesor = await db.query(
      'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
      [aula_id, usuario_id]
    );

    if (esProfesor.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta aula',
      });
    }

    // Verificar que no exista otra hoja con el mismo nombre en el aula
    const hojaExistente = await db.query(
      'SELECT * FROM hojas_aula WHERE aula_id = $1 AND nombre = $2 AND id != $3 AND activo = true',
      [aula_id, nombre, hoja_id]
    );

    if (hojaExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una hoja con ese nombre en esta aula',
      });
    }

    // Actualizar la hoja
    const resultado = await db.query(
      `UPDATE hojas_aula
       SET nombre = $1, orden = $2
       WHERE id = $3
       RETURNING *`,
      [nombre, orden, hoja_id]
    );

    res.status(200).json({
      success: true,
      message: 'Hoja actualizada exitosamente',
      data: resultado.rows[0],
    });

  } catch (error) {
    console.error('Error al actualizar hoja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la hoja',
      error: error.message,
    });
  }
};

/**
 * Eliminar una hoja
 * Solo profesores asignados al aula
 * No se puede eliminar si es la única hoja del aula
 */
const eliminarHoja = async (req, res) => {
  try {
    const { hoja_id } = req.params;
    const usuario_id = req.usuario.id;

    // Obtener el aula_id de la hoja
    const hojaActual = await db.query(
      'SELECT aula_id FROM hojas_aula WHERE id = $1',
      [hoja_id]
    );

    if (hojaActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hoja no encontrada',
      });
    }

    const aula_id = hojaActual.rows[0].aula_id;

    // Verificar que el usuario es profesor del aula
    const esProfesor = await db.query(
      'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
      [aula_id, usuario_id]
    );

    if (esProfesor.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta aula',
      });
    }

    // Verificar que no sea la única hoja activa del aula
    const totalHojas = await db.query(
      'SELECT COUNT(*) as total FROM hojas_aula WHERE aula_id = $1 AND activo = true',
      [aula_id]
    );

    if (parseInt(totalHojas.rows[0].total) <= 1) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la única hoja del aula',
      });
    }

    // Eliminar la hoja (cascada eliminará el contenido)
    await db.query('DELETE FROM hojas_aula WHERE id = $1', [hoja_id]);

    res.status(200).json({
      success: true,
      message: 'Hoja eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error al eliminar hoja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la hoja',
      error: error.message,
    });
  }
};

/**
 * Reordenar hojas de un aula
 * Solo profesores asignados al aula
 */
const reordenarHojas = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { aula_id, hojas } = req.body; // hojas = [{id, orden}, ...]
    const usuario_id = req.usuario.id;

    // Verificar que el usuario es profesor del aula
    const esProfesor = await db.query(
      'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
      [aula_id, usuario_id]
    );

    if (esProfesor.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta aula',
      });
    }

    // Actualizar el orden de cada hoja
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      for (const hoja of hojas) {
        await client.query(
          'UPDATE hojas_aula SET orden = $1 WHERE id = $2 AND aula_id = $3',
          [hoja.orden, hoja.id, aula_id]
        );
      }

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Hojas reordenadas exitosamente',
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error al reordenar hojas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reordenar las hojas',
      error: error.message,
    });
  }
};

/**
 * Cambiar visibilidad de una hoja
 * Solo profesores asignados al aula
 */
const cambiarVisibilidadHoja = async (req, res) => {
  try {
    const { hoja_id } = req.params;
    const usuario_id = req.usuario.id;

    // Obtener el aula_id y visibilidad actual de la hoja
    const hojaActual = await db.query(
      'SELECT aula_id, visible FROM hojas_aula WHERE id = $1',
      [hoja_id]
    );

    if (hojaActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hoja no encontrada',
      });
    }

    const aula_id = hojaActual.rows[0].aula_id;
    const visibleActual = hojaActual.rows[0].visible;

    // Verificar que el usuario es profesor del aula
    const esProfesor = await db.query(
      'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
      [aula_id, usuario_id]
    );

    if (esProfesor.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar esta aula',
      });
    }

    // Cambiar la visibilidad (toggle)
    const nuevoValor = !visibleActual;
    const resultado = await db.query(
      'UPDATE hojas_aula SET visible = $1 WHERE id = $2 RETURNING *',
      [nuevoValor, hoja_id]
    );

    res.status(200).json({
      success: true,
      message: `Hoja ${nuevoValor ? 'visible' : 'oculta'} exitosamente`,
      data: resultado.rows[0],
    });

  } catch (error) {
    console.error('Error al cambiar visibilidad de hoja:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar la visibilidad de la hoja',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerHojasAula,
  crearHoja,
  actualizarHoja,
  eliminarHoja,
  reordenarHojas,
  cambiarVisibilidadHoja,
};
