const db = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Crear una nueva evaluación
 * POST /api/evaluaciones
 */
const crearEvaluacion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const {
    aula_id,
    hoja_id,
    titulo,
    descripcion,
    nota_minima_aprobacion,
    fecha_inicio,
    fecha_fin,
    duracion_maxima_minutos,
    intentos_permitidos,
    cantidad_preguntas_mostrar,
    orden_aleatorio,
    mostrar_respuestas_correctas,
  } = req.body;

  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Verificar que el aula existe
    const aulaExiste = await db.query('SELECT id FROM aulas WHERE id = $1', [aula_id]);
    if (aulaExiste.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El aula no existe',
      });
    }

    // Verificar que el usuario es profesor del aula
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para crear evaluaciones en esta aula',
        });
      }
    }

    // Validar fechas si se proporcionan
    if (fecha_inicio && fecha_fin && new Date(fecha_inicio) >= new Date(fecha_fin)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin',
      });
    }

    // Insertar la evaluación
    const resultado = await db.query(
      `INSERT INTO evaluaciones
       (aula_id, hoja_id, creado_por, titulo, descripcion, nota_minima_aprobacion,
        fecha_inicio, fecha_fin, duracion_maxima_minutos, intentos_permitidos,
        cantidad_preguntas_mostrar, orden_aleatorio, mostrar_respuestas_correctas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        aula_id,
        hoja_id || null,
        usuario_id,
        titulo,
        descripcion || null,
        nota_minima_aprobacion || 6.0,
        fecha_inicio || null,
        fecha_fin || null,
        duracion_maxima_minutos || null,
        intentos_permitidos || 1,
        cantidad_preguntas_mostrar || 10,
        orden_aleatorio !== undefined ? orden_aleatorio : false,
        mostrar_respuestas_correctas !== undefined ? mostrar_respuestas_correctas : true,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Evaluación creada exitosamente',
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al crear evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la evaluación',
      error: error.message,
    });
  }
};

/**
 * Obtener evaluaciones de un aula
 * GET /api/evaluaciones/aula/:aula_id
 */
const obtenerEvaluacionesAula = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { aula_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Verificar acceso al aula
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

    // Construir query según el rol
    let query = `
      SELECT
        e.*,
        u.nombre || ' ' || u.apellido as creado_por_nombre,
        (SELECT COUNT(*) FROM preguntas_banco WHERE evaluacion_id = e.id) as total_preguntas_banco
      FROM evaluaciones e
      LEFT JOIN usuarios u ON e.creado_por = u.id
      WHERE e.aula_id = $1
    `;

    // Los estudiantes solo ven evaluaciones publicadas
    if (rol_activo === 'estudiante') {
      query += ` AND e.estado = 'publicado'`;
    }

    query += ' ORDER BY e.fecha_creacion DESC';

    const resultado = await db.query(query, [aula_id]);

    res.status(200).json({
      success: true,
      data: resultado.rows,
    });
  } catch (error) {
    console.error('Error al obtener evaluaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las evaluaciones',
      error: error.message,
    });
  }
};

/**
 * Obtener detalle de una evaluación
 * GET /api/evaluaciones/:evaluacion_id
 */
const obtenerEvaluacionDetalle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { evaluacion_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la evaluación
    const evaluacion = await db.query(
      `SELECT
        e.*,
        u.nombre || ' ' || u.apellido as creado_por_nombre,
        (SELECT COUNT(*) FROM preguntas_banco WHERE evaluacion_id = e.id) as total_preguntas_banco
      FROM evaluaciones e
      LEFT JOIN usuarios u ON e.creado_por = u.id
      WHERE e.id = $1`,
      [evaluacion_id]
    );

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada',
      });
    }

    const evaluacionData = evaluacion.rows[0];

    // Verificar acceso al aula
    let tieneAcceso = false;

    if (rol_activo === 'admin') {
      tieneAcceso = true;
    } else if (rol_activo === 'profesor') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );
      tieneAcceso = esProfesor.rows.length > 0;
    } else if (rol_activo === 'estudiante') {
      const esEstudiante = await db.query(
        'SELECT * FROM aula_estudiantes WHERE aula_id = $1 AND estudiante_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );
      // Estudiantes solo ven evaluaciones publicadas
      tieneAcceso = esEstudiante.rows.length > 0 && evaluacionData.estado === 'publicado';
    }

    if (!tieneAcceso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta evaluación',
      });
    }

    res.status(200).json({
      success: true,
      data: evaluacionData,
    });
  } catch (error) {
    console.error('Error al obtener detalle de evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle de la evaluación',
      error: error.message,
    });
  }
};

/**
 * Actualizar una evaluación
 * PUT /api/evaluaciones/:evaluacion_id
 */
const actualizarEvaluacion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { evaluacion_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la evaluación
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [evaluacion_id]);

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada',
      });
    }

    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para editar esta evaluación',
        });
      }
    }

    // Verificar si ya hay intentos entregados
    const hayIntentos = await db.query(
      `SELECT COUNT(*) as total FROM intentos_evaluacion
       WHERE evaluacion_id = $1 AND estado != 'en_progreso'`,
      [evaluacion_id]
    );

    if (parseInt(hayIntentos.rows[0].total) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una evaluación que ya tiene intentos entregados',
      });
    }

    // Actualizar solo los campos proporcionados
    const {
      titulo,
      descripcion,
      nota_minima_aprobacion,
      fecha_inicio,
      fecha_fin,
      duracion_maxima_minutos,
      intentos_permitidos,
      cantidad_preguntas_mostrar,
      orden_aleatorio,
      mostrar_respuestas_correctas,
      estado,
    } = req.body;

    // Construir query de actualización dinámica
    const campos = [];
    const valores = [];
    let index = 1;

    if (titulo !== undefined) {
      campos.push(`titulo = $${index++}`);
      valores.push(titulo);
    }
    if (descripcion !== undefined) {
      campos.push(`descripcion = $${index++}`);
      valores.push(descripcion);
    }
    if (nota_minima_aprobacion !== undefined) {
      campos.push(`nota_minima_aprobacion = $${index++}`);
      valores.push(nota_minima_aprobacion);
    }
    if (fecha_inicio !== undefined) {
      campos.push(`fecha_inicio = $${index++}`);
      valores.push(fecha_inicio);
    }
    if (fecha_fin !== undefined) {
      campos.push(`fecha_fin = $${index++}`);
      valores.push(fecha_fin);
    }
    if (duracion_maxima_minutos !== undefined) {
      campos.push(`duracion_maxima_minutos = $${index++}`);
      valores.push(duracion_maxima_minutos);
    }
    if (intentos_permitidos !== undefined) {
      campos.push(`intentos_permitidos = $${index++}`);
      valores.push(intentos_permitidos);
    }
    if (cantidad_preguntas_mostrar !== undefined) {
      campos.push(`cantidad_preguntas_mostrar = $${index++}`);
      valores.push(cantidad_preguntas_mostrar);
    }
    if (orden_aleatorio !== undefined) {
      campos.push(`orden_aleatorio = $${index++}`);
      valores.push(orden_aleatorio);
    }
    if (mostrar_respuestas_correctas !== undefined) {
      campos.push(`mostrar_respuestas_correctas = $${index++}`);
      valores.push(mostrar_respuestas_correctas);
    }
    if (estado !== undefined) {
      campos.push(`estado = $${index++}`);
      valores.push(estado);
    }

    if (campos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
      });
    }

    valores.push(evaluacion_id);
    const query = `UPDATE evaluaciones SET ${campos.join(', ')} WHERE id = $${index} RETURNING *`;

    const resultado = await db.query(query, valores);

    res.status(200).json({
      success: true,
      message: 'Evaluación actualizada exitosamente',
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la evaluación',
      error: error.message,
    });
  }
};

/**
 * Eliminar una evaluación
 * DELETE /api/evaluaciones/:evaluacion_id
 */
const eliminarEvaluacion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { evaluacion_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la evaluación
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [evaluacion_id]);

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada',
      });
    }

    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta evaluación',
        });
      }
    }

    // Eliminar la evaluación (cascade eliminará todo lo relacionado)
    await db.query('DELETE FROM evaluaciones WHERE id = $1', [evaluacion_id]);

    res.status(200).json({
      success: true,
      message: 'Evaluación eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar evaluación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la evaluación',
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de una evaluación
 * GET /api/evaluaciones/:evaluacion_id/estadisticas
 */
const obtenerEstadisticas = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { evaluacion_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Verificar que la evaluación existe
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [evaluacion_id]);

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada',
      });
    }

    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos (solo profesores y admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver las estadísticas de esta evaluación',
        });
      }
    }

    // === MÉTRICAS GENERALES ===
    const metricas = await db.query(
      `SELECT
        COUNT(DISTINCT estudiante_id) as total_estudiantes,
        COUNT(*) as total_intentos,
        COUNT(*) FILTER (WHERE estado = 'calificado') as intentos_calificados,
        ROUND(AVG(nota_obtenida) FILTER (WHERE estado = 'calificado'), 2) as nota_promedio,
        MAX(nota_obtenida) FILTER (WHERE estado = 'calificado') as nota_maxima,
        MIN(nota_obtenida) FILTER (WHERE estado = 'calificado') as nota_minima,
        ROUND(AVG(tiempo_usado_minutos) FILTER (WHERE tiempo_usado_minutos IS NOT NULL), 1) as tiempo_promedio,
        COUNT(*) FILTER (WHERE estado = 'calificado' AND nota_obtenida >= $2) as aprobados,
        COUNT(*) FILTER (WHERE estado = 'calificado' AND nota_obtenida < $2) as desaprobados
      FROM intentos_evaluacion
      WHERE evaluacion_id = $1 AND estado != 'en_progreso'`,
      [evaluacion_id, evaluacionData.nota_minima_aprobacion]
    );

    const metricasGenerales = {
      total_estudiantes: parseInt(metricas.rows[0].total_estudiantes || 0),
      total_intentos: parseInt(metricas.rows[0].total_intentos || 0),
      intentos_calificados: parseInt(metricas.rows[0].intentos_calificados || 0),
      nota_promedio: parseFloat(metricas.rows[0].nota_promedio || 0),
      nota_maxima: parseFloat(metricas.rows[0].nota_maxima || 0),
      nota_minima: parseFloat(metricas.rows[0].nota_minima || 0),
      tiempo_promedio: parseFloat(metricas.rows[0].tiempo_promedio || 0),
      aprobados: parseInt(metricas.rows[0].aprobados || 0),
      desaprobados: parseInt(metricas.rows[0].desaprobados || 0),
      tasa_aprobacion:
        metricas.rows[0].intentos_calificados > 0
          ? ((metricas.rows[0].aprobados / metricas.rows[0].intentos_calificados) * 100).toFixed(1)
          : 0,
    };

    // === RENDIMIENTO POR PREGUNTA ===
    const rendimientoPorPregunta = await db.query(
      `SELECT
        pb.id,
        pb.enunciado,
        pb.tipo_pregunta,
        pb.puntaje as puntaje_maximo,
        COUNT(re.id) as total_respuestas,
        COUNT(re.id) FILTER (WHERE re.es_correcta = true) as respuestas_correctas,
        ROUND(AVG(re.puntaje_obtenido), 2) as puntaje_promedio,
        ROUND(
          (COUNT(re.id) FILTER (WHERE re.es_correcta = true)::NUMERIC / NULLIF(COUNT(re.id), 0)) * 100,
          1
        ) as porcentaje_acierto
      FROM preguntas_banco pb
      LEFT JOIN preguntas_intento pi ON pb.id = pi.pregunta_id
      LEFT JOIN respuestas_estudiante re ON pi.pregunta_id = re.pregunta_id AND pi.intento_id = re.intento_id
      LEFT JOIN intentos_evaluacion ie ON pi.intento_id = ie.id
      WHERE pb.evaluacion_id = $1
        AND (ie.estado = 'calificado' OR ie.estado IS NULL)
      GROUP BY pb.id, pb.enunciado, pb.tipo_pregunta, pb.puntaje
      ORDER BY pb.fecha_creacion`,
      [evaluacion_id]
    );

    const preguntasEstadisticas = rendimientoPorPregunta.rows.map((p) => ({
      id: p.id,
      enunciado: p.enunciado,
      tipo_pregunta: p.tipo_pregunta,
      puntaje_maximo: parseFloat(p.puntaje_maximo),
      total_respuestas: parseInt(p.total_respuestas || 0),
      respuestas_correctas: parseInt(p.respuestas_correctas || 0),
      puntaje_promedio: parseFloat(p.puntaje_promedio || 0),
      porcentaje_acierto: parseFloat(p.porcentaje_acierto || 0),
    }));

    // === DISTRIBUCIÓN DE NOTAS (rangos) ===
    const distribucion = await db.query(
      `SELECT
        CASE
          WHEN nota_obtenida < 4 THEN '0-3.99'
          WHEN nota_obtenida >= 4 AND nota_obtenida < 6 THEN '4-5.99'
          WHEN nota_obtenida >= 6 AND nota_obtenida < 8 THEN '6-7.99'
          WHEN nota_obtenida >= 8 AND nota_obtenida < 9 THEN '8-8.99'
          ELSE '9-10'
        END as rango,
        COUNT(*) as cantidad
      FROM intentos_evaluacion
      WHERE evaluacion_id = $1 AND estado = 'calificado'
      GROUP BY rango
      ORDER BY rango`,
      [evaluacion_id]
    );

    const distribucionNotas = {
      '0-3.99': 0,
      '4-5.99': 0,
      '6-7.99': 0,
      '8-8.99': 0,
      '9-10': 0,
    };

    distribucion.rows.forEach((row) => {
      distribucionNotas[row.rango] = parseInt(row.cantidad);
    });

    // === LISTA DE ESTUDIANTES CON SUS MEJORES INTENTOS ===
    const estudiantes = await db.query(
      `SELECT DISTINCT ON (ie.estudiante_id)
        ie.estudiante_id,
        u.nombre || ' ' || u.apellido as estudiante_nombre,
        u.email as estudiante_email,
        ie.id as intento_id,
        ie.numero_intento,
        ie.estado,
        ie.nota_obtenida,
        ie.puntaje_obtenido,
        ie.puntaje_total,
        ie.fecha_entrega,
        ie.tiempo_usado_minutos,
        CASE
          WHEN ie.nota_obtenida >= $2 THEN true
          ELSE false
        END as aprobo
      FROM intentos_evaluacion ie
      JOIN usuarios u ON ie.estudiante_id = u.id
      WHERE ie.evaluacion_id = $1 AND ie.estado = 'calificado'
      ORDER BY ie.estudiante_id, ie.nota_obtenida DESC, ie.fecha_entrega DESC`,
      [evaluacion_id, evaluacionData.nota_minima_aprobacion]
    );

    const listaEstudiantes = estudiantes.rows.map((e) => ({
      estudiante_id: e.estudiante_id,
      estudiante_nombre: e.estudiante_nombre,
      estudiante_email: e.estudiante_email,
      mejor_intento: {
        id: e.intento_id,
        numero_intento: e.numero_intento,
        estado: e.estado,
        nota_obtenida: parseFloat(e.nota_obtenida),
        puntaje_obtenido: parseFloat(e.puntaje_obtenido || 0),
        puntaje_total: parseFloat(e.puntaje_total),
        fecha_entrega: e.fecha_entrega,
        tiempo_usado_minutos: e.tiempo_usado_minutos,
        aprobo: e.aprobo,
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        evaluacion: {
          id: evaluacionData.id,
          titulo: evaluacionData.titulo,
          nota_minima_aprobacion: evaluacionData.nota_minima_aprobacion,
        },
        metricas_generales: metricasGenerales,
        rendimiento_por_pregunta: preguntasEstadisticas,
        distribucion_notas: distribucionNotas,
        estudiantes: listaEstudiantes,
      },
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error.message,
    });
  }
};

/**
 * Exportar estadísticas a Excel
 * GET /api/evaluaciones/:evaluacion_id/exportar-excel
 */
const exportarEstadisticasExcel = async (req, res) => {
  const ExcelJS = require('exceljs');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { evaluacion_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Verificar que la evaluación existe
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [evaluacion_id]);

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada',
      });
    }

    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos (solo profesores y admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para exportar las estadísticas de esta evaluación',
        });
      }
    }

    // Obtener datos de estadísticas (reutilizar queries)
    // === MÉTRICAS GENERALES ===
    const metricas = await db.query(
      `SELECT
        COUNT(DISTINCT estudiante_id) as total_estudiantes,
        COUNT(*) as total_intentos,
        COUNT(*) FILTER (WHERE estado = 'calificado') as intentos_calificados,
        ROUND(AVG(nota_obtenida) FILTER (WHERE estado = 'calificado'), 2) as nota_promedio,
        MAX(nota_obtenida) FILTER (WHERE estado = 'calificado') as nota_maxima,
        MIN(nota_obtenida) FILTER (WHERE estado = 'calificado') as nota_minima,
        ROUND(AVG(tiempo_usado_minutos) FILTER (WHERE tiempo_usado_minutos IS NOT NULL), 1) as tiempo_promedio,
        COUNT(*) FILTER (WHERE estado = 'calificado' AND nota_obtenida >= $2) as aprobados,
        COUNT(*) FILTER (WHERE estado = 'calificado' AND nota_obtenida < $2) as desaprobados
      FROM intentos_evaluacion
      WHERE evaluacion_id = $1 AND estado != 'en_progreso'`,
      [evaluacion_id, evaluacionData.nota_minima_aprobacion]
    );

    // === RENDIMIENTO POR PREGUNTA ===
    const rendimientoPorPregunta = await db.query(
      `SELECT
        pb.id,
        pb.enunciado,
        pb.tipo_pregunta,
        pb.puntaje as puntaje_maximo,
        COUNT(re.id) as total_respuestas,
        COUNT(re.id) FILTER (WHERE re.es_correcta = true) as respuestas_correctas,
        ROUND(AVG(re.puntaje_obtenido), 2) as puntaje_promedio,
        ROUND(
          (COUNT(re.id) FILTER (WHERE re.es_correcta = true)::NUMERIC / NULLIF(COUNT(re.id), 0)) * 100,
          1
        ) as porcentaje_acierto
      FROM preguntas_banco pb
      LEFT JOIN preguntas_intento pi ON pb.id = pi.pregunta_id
      LEFT JOIN respuestas_estudiante re ON pi.pregunta_id = re.pregunta_id AND pi.intento_id = re.intento_id
      LEFT JOIN intentos_evaluacion ie ON pi.intento_id = ie.id
      WHERE pb.evaluacion_id = $1
        AND (ie.estado = 'calificado' OR ie.estado IS NULL)
      GROUP BY pb.id, pb.enunciado, pb.tipo_pregunta, pb.puntaje
      ORDER BY pb.fecha_creacion`,
      [evaluacion_id]
    );

    // === DISTRIBUCIÓN DE NOTAS ===
    const distribucion = await db.query(
      `SELECT
        CASE
          WHEN nota_obtenida < 4 THEN '0-3.99'
          WHEN nota_obtenida >= 4 AND nota_obtenida < 6 THEN '4-5.99'
          WHEN nota_obtenida >= 6 AND nota_obtenida < 8 THEN '6-7.99'
          WHEN nota_obtenida >= 8 AND nota_obtenida < 9 THEN '8-8.99'
          ELSE '9-10'
        END as rango,
        COUNT(*) as cantidad
      FROM intentos_evaluacion
      WHERE evaluacion_id = $1 AND estado = 'calificado'
      GROUP BY rango
      ORDER BY rango`,
      [evaluacion_id]
    );

    // === LISTA DE ESTUDIANTES ===
    const estudiantes = await db.query(
      `SELECT DISTINCT ON (ie.estudiante_id)
        ie.estudiante_id,
        u.nombre || ' ' || u.apellido as estudiante_nombre,
        u.email as estudiante_email,
        ie.id as intento_id,
        ie.numero_intento,
        ie.estado,
        ie.nota_obtenida,
        ie.puntaje_obtenido,
        ie.puntaje_total,
        ie.fecha_entrega,
        ie.tiempo_usado_minutos,
        CASE
          WHEN ie.nota_obtenida >= $2 THEN true
          ELSE false
        END as aprobo
      FROM intentos_evaluacion ie
      JOIN usuarios u ON ie.estudiante_id = u.id
      WHERE ie.evaluacion_id = $1 AND ie.estado = 'calificado'
      ORDER BY ie.estudiante_id, ie.nota_obtenida DESC, ie.fecha_entrega DESC`,
      [evaluacion_id, evaluacionData.nota_minima_aprobacion]
    );

    // Crear workbook de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AulaVirtual';
    workbook.created = new Date();

    // === HOJA 1: Métricas Generales ===
    const hojaMetricas = workbook.addWorksheet('Métricas Generales');

    hojaMetricas.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 },
    ];

    // Estilo del encabezado
    hojaMetricas.getRow(1).font = { bold: true, size: 12 };
    hojaMetricas.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    hojaMetricas.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const metricasData = metricas.rows[0];
    const tasaAprobacion = metricasData.intentos_calificados > 0
      ? ((metricasData.aprobados / metricasData.intentos_calificados) * 100).toFixed(1)
      : 0;

    hojaMetricas.addRows([
      { metrica: 'Evaluación', valor: evaluacionData.titulo },
      { metrica: 'Total Estudiantes', valor: metricasData.total_estudiantes },
      { metrica: 'Total Intentos', valor: metricasData.total_intentos },
      { metrica: 'Intentos Calificados', valor: metricasData.intentos_calificados },
      { metrica: 'Nota Promedio', valor: parseFloat(metricasData.nota_promedio || 0) },
      { metrica: 'Nota Máxima', valor: parseFloat(metricasData.nota_maxima || 0) },
      { metrica: 'Nota Mínima', valor: parseFloat(metricasData.nota_minima || 0) },
      { metrica: 'Tiempo Promedio (min)', valor: parseFloat(metricasData.tiempo_promedio || 0) },
      { metrica: 'Aprobados', valor: metricasData.aprobados },
      { metrica: 'Desaprobados', valor: metricasData.desaprobados },
      { metrica: 'Tasa de Aprobación (%)', valor: tasaAprobacion },
    ]);

    // === HOJA 2: Estudiantes ===
    const hojaEstudiantes = workbook.addWorksheet('Estudiantes');

    hojaEstudiantes.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Intento', key: 'intento', width: 10 },
      { header: 'Puntaje', key: 'puntaje', width: 15 },
      { header: 'Nota', key: 'nota', width: 10 },
      { header: 'Tiempo (min)', key: 'tiempo', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha Entrega', key: 'fecha', width: 20 },
    ];

    // Estilo del encabezado
    hojaEstudiantes.getRow(1).font = { bold: true, size: 12 };
    hojaEstudiantes.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    hojaEstudiantes.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    estudiantes.rows.forEach((estudiante) => {
      hojaEstudiantes.addRow({
        nombre: estudiante.estudiante_nombre,
        email: estudiante.estudiante_email,
        intento: estudiante.numero_intento,
        puntaje: `${estudiante.puntaje_obtenido} / ${estudiante.puntaje_total}`,
        nota: parseFloat(estudiante.nota_obtenida),
        tiempo: estudiante.tiempo_usado_minutos || '-',
        estado: estudiante.aprobo ? 'Aprobado' : 'Desaprobado',
        fecha: estudiante.fecha_entrega ? new Date(estudiante.fecha_entrega).toLocaleString('es-AR') : '-',
      });
    });

    // === HOJA 3: Rendimiento por Pregunta ===
    const hojaPreguntas = workbook.addWorksheet('Rendimiento por Pregunta');

    hojaPreguntas.columns = [
      { header: '#', key: 'numero', width: 5 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Enunciado', key: 'enunciado', width: 50 },
      { header: 'Puntaje Máx.', key: 'puntaje_max', width: 12 },
      { header: 'Respuestas', key: 'respuestas', width: 12 },
      { header: '% Acierto', key: 'porcentaje', width: 12 },
      { header: 'Puntaje Prom.', key: 'puntaje_prom', width: 15 },
    ];

    // Estilo del encabezado
    hojaPreguntas.getRow(1).font = { bold: true, size: 12 };
    hojaPreguntas.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    hojaPreguntas.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    rendimientoPorPregunta.rows.forEach((pregunta, index) => {
      hojaPreguntas.addRow({
        numero: index + 1,
        tipo: pregunta.tipo_pregunta,
        enunciado: pregunta.enunciado,
        puntaje_max: parseFloat(pregunta.puntaje_maximo),
        respuestas: parseInt(pregunta.total_respuestas || 0),
        porcentaje: parseFloat(pregunta.porcentaje_acierto || 0) + '%',
        puntaje_prom: parseFloat(pregunta.puntaje_promedio || 0),
      });
    });

    // === HOJA 4: Distribución de Notas ===
    const hojaDistribucion = workbook.addWorksheet('Distribución de Notas');

    hojaDistribucion.columns = [
      { header: 'Rango', key: 'rango', width: 15 },
      { header: 'Cantidad', key: 'cantidad', width: 15 },
    ];

    // Estilo del encabezado
    hojaDistribucion.getRow(1).font = { bold: true, size: 12 };
    hojaDistribucion.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    hojaDistribucion.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const distribucionNotas = {
      '0-3.99': 0,
      '4-5.99': 0,
      '6-7.99': 0,
      '8-8.99': 0,
      '9-10': 0,
    };

    distribucion.rows.forEach((row) => {
      distribucionNotas[row.rango] = parseInt(row.cantidad);
    });

    Object.entries(distribucionNotas).forEach(([rango, cantidad]) => {
      hojaDistribucion.addRow({ rango, cantidad });
    });

    // Generar el archivo Excel en memoria
    const buffer = await workbook.xlsx.writeBuffer();

    // Configurar headers para descarga
    const nombreArchivo = `Estadisticas_${evaluacionData.titulo.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Error al exportar estadísticas a Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar las estadísticas',
      error: error.message,
    });
  }
};

/**
 * Exportar estadísticas a PDF con gráficos
 * GET /api/evaluaciones/:evaluacion_id/exportar-pdf
 */
const exportarEstadisticasPDF = async (req, res) => {
  const PDFDocument = require('pdfkit');
  const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { evaluacion_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Verificar que la evaluación existe
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [evaluacion_id]);

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada',
      });
    }

    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos (solo profesores y admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para exportar las estadísticas de esta evaluación',
        });
      }
    }

    // Obtener datos de estadísticas (queries idénticas al Excel)
    // === MÉTRICAS GENERALES ===
    const metricas = await db.query(
      `SELECT
        COUNT(DISTINCT estudiante_id) as total_estudiantes,
        COUNT(*) as total_intentos,
        COUNT(*) FILTER (WHERE estado = 'calificado') as intentos_calificados,
        ROUND(AVG(nota_obtenida) FILTER (WHERE estado = 'calificado'), 2) as nota_promedio,
        MAX(nota_obtenida) FILTER (WHERE estado = 'calificado') as nota_maxima,
        MIN(nota_obtenida) FILTER (WHERE estado = 'calificado') as nota_minima,
        ROUND(AVG(tiempo_usado_minutos) FILTER (WHERE tiempo_usado_minutos IS NOT NULL), 1) as tiempo_promedio,
        COUNT(*) FILTER (WHERE estado = 'calificado' AND nota_obtenida >= $2) as aprobados,
        COUNT(*) FILTER (WHERE estado = 'calificado' AND nota_obtenida < $2) as desaprobados
      FROM intentos_evaluacion
      WHERE evaluacion_id = $1 AND estado != 'en_progreso'`,
      [evaluacion_id, evaluacionData.nota_minima_aprobacion]
    );

    const metricasData = metricas.rows[0];
    const tasaAprobacion =
      metricasData.intentos_calificados > 0
        ? ((metricasData.aprobados / metricasData.intentos_calificados) * 100).toFixed(1)
        : 0;

    // === DISTRIBUCIÓN DE NOTAS ===
    const distribucion = await db.query(
      `SELECT
        CASE
          WHEN nota_obtenida < 4 THEN '0-3.99'
          WHEN nota_obtenida >= 4 AND nota_obtenida < 6 THEN '4-5.99'
          WHEN nota_obtenida >= 6 AND nota_obtenida < 8 THEN '6-7.99'
          WHEN nota_obtenida >= 8 AND nota_obtenida < 9 THEN '8-8.99'
          ELSE '9-10'
        END as rango,
        COUNT(*) as cantidad
      FROM intentos_evaluacion
      WHERE evaluacion_id = $1 AND estado = 'calificado'
      GROUP BY rango
      ORDER BY rango`,
      [evaluacion_id]
    );

    const distribucionNotas = {
      '0-3.99': 0,
      '4-5.99': 0,
      '6-7.99': 0,
      '8-8.99': 0,
      '9-10': 0,
    };

    distribucion.rows.forEach((row) => {
      distribucionNotas[row.rango] = parseInt(row.cantidad);
    });

    // === RENDIMIENTO POR PREGUNTA ===
    const rendimientoPorPregunta = await db.query(
      `SELECT
        pb.enunciado,
        pb.tipo_pregunta,
        ROUND(AVG(re.puntaje_obtenido), 2) as puntaje_promedio,
        ROUND(
          (COUNT(re.id) FILTER (WHERE re.es_correcta = true)::NUMERIC / NULLIF(COUNT(re.id), 0)) * 100,
          1
        ) as porcentaje_acierto
      FROM preguntas_banco pb
      LEFT JOIN preguntas_intento pi ON pb.id = pi.pregunta_id
      LEFT JOIN respuestas_estudiante re ON pi.pregunta_id = re.pregunta_id AND pi.intento_id = re.intento_id
      LEFT JOIN intentos_evaluacion ie ON pi.intento_id = ie.id
      WHERE pb.evaluacion_id = $1
        AND (ie.estado = 'calificado' OR ie.estado IS NULL)
      GROUP BY pb.id, pb.enunciado, pb.tipo_pregunta, pb.puntaje
      ORDER BY pb.fecha_creacion
      LIMIT 10`,
      [evaluacion_id]
    );

    // === LISTA DE ESTUDIANTES ===
    const estudiantes = await db.query(
      `SELECT DISTINCT ON (ie.estudiante_id)
        u.nombre || ' ' || u.apellido as estudiante_nombre,
        ie.numero_intento,
        ie.nota_obtenida,
        ie.puntaje_obtenido,
        ie.puntaje_total,
        CASE
          WHEN ie.nota_obtenida >= $2 THEN true
          ELSE false
        END as aprobo
      FROM intentos_evaluacion ie
      JOIN usuarios u ON ie.estudiante_id = u.id
      WHERE ie.evaluacion_id = $1 AND ie.estado = 'calificado'
      ORDER BY ie.estudiante_id, ie.nota_obtenida DESC
      LIMIT 20`,
      [evaluacion_id, evaluacionData.nota_minima_aprobacion]
    );

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const nombreArchivo = `Estadisticas_${evaluacionData.titulo.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });

    // === PORTADA ===
    doc.fontSize(28).font('Helvetica-Bold').text('Estadísticas de Evaluación', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(20).font('Helvetica').text(evaluacionData.titulo, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Fecha de generación: ${new Date().toLocaleDateString('es-AR')}`, { align: 'center' });
    doc.moveDown(3);

    // === MÉTRICAS GENERALES ===
    doc.fontSize(18).font('Helvetica-Bold').text('Métricas Generales', { underline: true });
    doc.moveDown(1);

    const metricas_y = doc.y;
    doc.fontSize(11).font('Helvetica');

    const metricasInfo = [
      { label: 'Total de Estudiantes:', value: metricasData.total_estudiantes },
      { label: 'Total de Intentos:', value: metricasData.total_intentos },
      { label: 'Intentos Calificados:', value: metricasData.intentos_calificados },
      { label: 'Nota Promedio:', value: parseFloat(metricasData.nota_promedio || 0).toFixed(2) },
      { label: 'Nota Máxima:', value: parseFloat(metricasData.nota_maxima || 0).toFixed(2) },
      { label: 'Nota Mínima:', value: parseFloat(metricasData.nota_minima || 0).toFixed(2) },
      { label: 'Tiempo Promedio:', value: `${parseFloat(metricasData.tiempo_promedio || 0)} min` },
      { label: 'Aprobados:', value: metricasData.aprobados },
      { label: 'Desaprobados:', value: metricasData.desaprobados },
      { label: 'Tasa de Aprobación:', value: `${tasaAprobacion}%` },
    ];

    metricasInfo.forEach((item, index) => {
      doc.text(`${item.label} ${item.value}`, 50, metricas_y + index * 20);
    });

    doc.moveDown(12);

    // === GRÁFICO DE DISTRIBUCIÓN DE NOTAS ===
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('Distribución de Notas', { underline: true });
    doc.moveDown(1);

    // Generar gráfico con ChartJS
    const chartCallback = new ChartJSNodeCanvas({ width: 500, height: 300, backgroundColour: 'white' });

    const chartConfig = {
      type: 'bar',
      data: {
        labels: Object.keys(distribucionNotas),
        datasets: [
          {
            label: 'Cantidad de Estudiantes',
            data: Object.values(distribucionNotas),
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    };

    const chartImage = await chartCallback.renderToBuffer(chartConfig);
    doc.image(chartImage, 50, doc.y, { width: 500 });

    // === TABLA DE ESTUDIANTES ===
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('Mejores Notas por Estudiante', { underline: true });
    doc.moveDown(1);

    // Encabezados de tabla
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Estudiante', 50, tableTop, { width: 150 });
    doc.text('Intento', 210, tableTop, { width: 50 });
    doc.text('Puntaje', 270, tableTop, { width: 80 });
    doc.text('Nota', 360, tableTop, { width: 60 });
    doc.text('Estado', 430, tableTop, { width: 80 });

    doc.moveDown(0.5);
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Filas de estudiantes
    doc.fontSize(9).font('Helvetica');
    estudiantes.rows.forEach((estudiante) => {
      const rowY = doc.y;

      // Si no hay espacio, añadir nueva página
      if (rowY > 700) {
        doc.addPage();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Estudiante', 50, 50, { width: 150 });
        doc.text('Intento', 210, 50, { width: 50 });
        doc.text('Puntaje', 270, 50, { width: 80 });
        doc.text('Nota', 360, 50, { width: 60 });
        doc.text('Estado', 430, 50, { width: 80 });
        doc.moveDown(1);
        doc.fontSize(9).font('Helvetica');
      }

      doc.text(estudiante.estudiante_nombre, 50, doc.y, { width: 150, ellipsis: true });
      doc.text(`#${estudiante.numero_intento}`, 210, rowY, { width: 50 });
      doc.text(`${estudiante.puntaje_obtenido}/${estudiante.puntaje_total}`, 270, rowY, { width: 80 });
      doc.text(parseFloat(estudiante.nota_obtenida).toFixed(2), 360, rowY, { width: 60 });
      doc
        .fillColor(estudiante.aprobo ? '#10b981' : '#ef4444')
        .text(estudiante.aprobo ? 'Aprobado' : 'Desaprobado', 430, rowY, { width: 80 });
      doc.fillColor('#000000');

      doc.moveDown(0.8);
    });

    // === RENDIMIENTO POR PREGUNTA ===
    if (rendimientoPorPregunta.rows.length > 0) {
      doc.addPage();
      doc.fontSize(16).font('Helvetica-Bold').text('Rendimiento por Pregunta (Top 10)', { underline: true });
      doc.moveDown(1);

      // Gráfico de barras horizontales
      const preguntasLabels = rendimientoPorPregunta.rows.map(
        (p, i) => `P${i + 1}: ${p.enunciado.substring(0, 30)}...`
      );
      const preguntasData = rendimientoPorPregunta.rows.map((p) => parseFloat(p.porcentaje_acierto || 0));

      const preguntasChartConfig = {
        type: 'bar',
        data: {
          labels: preguntasLabels,
          datasets: [
            {
              label: '% de Acierto',
              data: preguntasData,
              backgroundColor: preguntasData.map((v) => (v >= 70 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ef4444')),
            },
          ],
        },
        options: {
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
            },
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
          },
        },
      };

      const preguntasChartImage = await chartCallback.renderToBuffer(preguntasChartConfig);
      doc.image(preguntasChartImage, 50, doc.y, { width: 500 });
    }

    // Finalizar PDF
    doc.end();
  } catch (error) {
    console.error('Error al exportar estadísticas a PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar las estadísticas',
      error: error.message,
    });
  }
};

module.exports = {
  crearEvaluacion,
  obtenerEvaluacionesAula,
  obtenerEvaluacionDetalle,
  actualizarEvaluacion,
  eliminarEvaluacion,
  obtenerEstadisticas,
  exportarEstadisticasExcel,
  exportarEstadisticasPDF,
};
