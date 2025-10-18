const { validationResult } = require('express-validator');
const db = require('../config/database');

/**
 * Obtener todo el contenido de una hoja de un aula ordenado
 * Accesible por profesores asignados y estudiantes matriculados
 */
const obtenerContenidoAula = async (req, res) => {
  try {
    const { aula_id } = req.params;
    const { hoja_id } = req.query; // hoja_id es query param
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

    // Obtener el contenido ordenado filtrado por hoja
    // Profesores y admins ven todo el contenido, estudiantes solo el visible
    let query = `SELECT
      id,
      tipo,
      contenido,
      orden,
      visible,
      fecha_creacion,
      fecha_actualizacion
    FROM contenido_aulas
    WHERE aula_id = $1 AND hoja_id = $2`;

    // Si es estudiante, filtrar solo contenido visible
    if (rol_activo === 'estudiante') {
      query += ' AND visible = true';
    }

    query += ' ORDER BY orden ASC';

    const contenido = await db.query(query, [aula_id, hoja_id]);

    res.status(200).json({
      success: true,
      data: contenido.rows,
      total: contenido.rows.length,
    });

  } catch (error) {
    console.error('Error al obtener contenido del aula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el contenido del aula',
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo bloque de contenido
 * Solo profesores asignados al aula
 */
const crearBloque = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { aula_id, hoja_id, tipo, contenido, orden } = req.body;
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

    // Crear el bloque
    const resultado = await db.query(
      `INSERT INTO contenido_aulas (aula_id, hoja_id, tipo, contenido, orden, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [aula_id, hoja_id, tipo, contenido, orden, usuario_id]
    );

    res.status(201).json({
      success: true,
      message: 'Bloque creado exitosamente',
      data: resultado.rows[0],
    });

  } catch (error) {
    console.error('Error al crear bloque:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el bloque',
      error: error.message,
    });
  }
};

/**
 * Actualizar un bloque de contenido existente
 * Solo profesores asignados al aula
 */
const actualizarBloque = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { bloque_id } = req.params;
    const { tipo, contenido, orden } = req.body;
    const usuario_id = req.usuario.id;

    // Obtener el aula_id del bloque
    const bloqueActual = await db.query(
      'SELECT aula_id FROM contenido_aulas WHERE id = $1',
      [bloque_id]
    );

    if (bloqueActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bloque no encontrado',
      });
    }

    const aula_id = bloqueActual.rows[0].aula_id;

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

    // Actualizar el bloque
    const resultado = await db.query(
      `UPDATE contenido_aulas
       SET tipo = $1, contenido = $2, orden = $3
       WHERE id = $4
       RETURNING *`,
      [tipo, contenido, orden, bloque_id]
    );

    res.status(200).json({
      success: true,
      message: 'Bloque actualizado exitosamente',
      data: resultado.rows[0],
    });

  } catch (error) {
    console.error('Error al actualizar bloque:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el bloque',
      error: error.message,
    });
  }
};

/**
 * Eliminar un bloque de contenido
 * Solo profesores asignados al aula
 */
const eliminarBloque = async (req, res) => {
  try {
    const { bloque_id } = req.params;
    const usuario_id = req.usuario.id;

    // Obtener el aula_id del bloque
    const bloqueActual = await db.query(
      'SELECT aula_id FROM contenido_aulas WHERE id = $1',
      [bloque_id]
    );

    if (bloqueActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bloque no encontrado',
      });
    }

    const aula_id = bloqueActual.rows[0].aula_id;

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

    // Eliminar el bloque
    await db.query('DELETE FROM contenido_aulas WHERE id = $1', [bloque_id]);

    res.status(200).json({
      success: true,
      message: 'Bloque eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error al eliminar bloque:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el bloque',
      error: error.message,
    });
  }
};

/**
 * Reordenar bloques de contenido
 * Solo profesores asignados al aula
 */
const reordenarBloques = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { aula_id, bloques } = req.body; // bloques = [{id, orden}, ...]
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

    // Actualizar el orden de cada bloque
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      for (const bloque of bloques) {
        await client.query(
          'UPDATE contenido_aulas SET orden = $1 WHERE id = $2 AND aula_id = $3',
          [bloque.orden, bloque.id, aula_id]
        );
      }

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Bloques reordenados exitosamente',
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error al reordenar bloques:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reordenar los bloques',
      error: error.message,
    });
  }
};

/**
 * Cambiar visibilidad de un bloque de contenido
 * Solo profesores asignados al aula
 */
const cambiarVisibilidadBloque = async (req, res) => {
  try {
    const { bloque_id } = req.params;
    const usuario_id = req.usuario.id;

    // Obtener el aula_id y visibilidad actual del bloque
    const bloqueActual = await db.query(
      'SELECT aula_id, visible FROM contenido_aulas WHERE id = $1',
      [bloque_id]
    );

    if (bloqueActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bloque no encontrado',
      });
    }

    const aula_id = bloqueActual.rows[0].aula_id;
    const visibleActual = bloqueActual.rows[0].visible;

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
      'UPDATE contenido_aulas SET visible = $1 WHERE id = $2 RETURNING *',
      [nuevoValor, bloque_id]
    );

    res.status(200).json({
      success: true,
      message: `Bloque ${nuevoValor ? 'visible' : 'oculto'} exitosamente`,
      data: resultado.rows[0],
    });

  } catch (error) {
    console.error('Error al cambiar visibilidad de bloque:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar la visibilidad del bloque',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerContenidoAula,
  crearBloque,
  actualizarBloque,
  eliminarBloque,
  reordenarBloques,
  cambiarVisibilidadBloque,
};
