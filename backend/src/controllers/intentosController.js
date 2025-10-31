const db = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Iniciar un nuevo intento de evaluación
 * POST /api/intentos/iniciar
 */
const iniciarIntento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { evaluacion_id } = req.body;
  const estudiante_id = req.usuario.id;

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

    // Verificar que esté publicada
    if (evaluacionData.estado !== 'publicado') {
      return res.status(400).json({
        success: false,
        message: 'Esta evaluación no está disponible',
      });
    }

    // Verificar fechas
    const ahora = new Date();
    if (evaluacionData.fecha_inicio && new Date(evaluacionData.fecha_inicio) > ahora) {
      return res.status(400).json({
        success: false,
        message: 'La evaluación aún no ha comenzado',
      });
    }

    if (evaluacionData.fecha_fin && new Date(evaluacionData.fecha_fin) < ahora) {
      return res.status(400).json({
        success: false,
        message: 'La evaluación ya finalizó',
      });
    }

    // Verificar que el estudiante esté matriculado en el aula
    const matriculado = await db.query(
      'SELECT * FROM aula_estudiantes WHERE aula_id = $1 AND estudiante_id = $2 AND activo = true',
      [evaluacionData.aula_id, estudiante_id]
    );

    if (matriculado.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No estás matriculado en esta aula',
      });
    }

    // Verificar intentos previos
    const intentosPrevios = await db.query(
      'SELECT COUNT(*) as total FROM intentos_evaluacion WHERE evaluacion_id = $1 AND estudiante_id = $2',
      [evaluacion_id, estudiante_id]
    );

    const totalIntentos = parseInt(intentosPrevios.rows[0].total);

    if (totalIntentos >= evaluacionData.intentos_permitidos) {
      return res.status(400).json({
        success: false,
        message: `Ya has usado todos tus intentos (${evaluacionData.intentos_permitidos})`,
      });
    }

    // Verificar si hay un intento en progreso
    const intentoEnProgreso = await db.query(
      `SELECT * FROM intentos_evaluacion
       WHERE evaluacion_id = $1 AND estudiante_id = $2 AND estado = 'en_progreso'`,
      [evaluacion_id, estudiante_id]
    );

    if (intentoEnProgreso.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes un intento en progreso',
        intento_id: intentoEnProgreso.rows[0].id,
      });
    }

    // Obtener todas las preguntas del banco
    const preguntasBanco = await db.query(
      'SELECT * FROM preguntas_banco WHERE evaluacion_id = $1 ORDER BY orden ASC',
      [evaluacion_id]
    );

    if (preguntasBanco.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Esta evaluación no tiene preguntas',
      });
    }

    // Seleccionar preguntas aleatorias
    let preguntasSeleccionadas = [];
    const cantidadMostrar = Math.min(
      evaluacionData.cantidad_preguntas_mostrar,
      preguntasBanco.rows.length
    );

    if (evaluacionData.orden_aleatorio) {
      // Mezclar aleatoriamente y tomar las primeras N
      const preguntasMezcladas = [...preguntasBanco.rows].sort(() => Math.random() - 0.5);
      preguntasSeleccionadas = preguntasMezcladas.slice(0, cantidadMostrar);
    } else {
      // Tomar las primeras N en orden
      preguntasSeleccionadas = preguntasBanco.rows.slice(0, cantidadMostrar);
    }

    // Calcular puntaje total
    const puntaje_total = preguntasSeleccionadas.reduce(
      (sum, p) => sum + parseFloat(p.puntaje),
      0
    );

    // Crear el intento con manejo de duplicate key
    let nuevoIntento;
    try {
      nuevoIntento = await db.query(
        `INSERT INTO intentos_evaluacion
         (evaluacion_id, estudiante_id, numero_intento, puntaje_total, fecha_inicio)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [evaluacion_id, estudiante_id, totalIntentos + 1, puntaje_total]
      );
    } catch (insertError) {
      // Si es un error de duplicate key, verificar si hay un intento en progreso
      if (insertError.code === '23505') {
        const intentoExistente = await db.query(
          `SELECT * FROM intentos_evaluacion
           WHERE evaluacion_id = $1 AND estudiante_id = $2 AND estado = 'en_progreso'
           ORDER BY fecha_inicio DESC LIMIT 1`,
          [evaluacion_id, estudiante_id]
        );

        if (intentoExistente.rows.length > 0) {
          // Devolver el intento existente
          return res.status(200).json({
            success: true,
            message: 'Intento en progreso encontrado',
            data: {
              intento_id: intentoExistente.rows[0].id,
              numero_intento: intentoExistente.rows[0].numero_intento,
              puntaje_total: intentoExistente.rows[0].puntaje_total,
              fecha_inicio: intentoExistente.rows[0].fecha_inicio,
              duracion_maxima_minutos: evaluacionData.duracion_maxima_minutos,
              fecha_fin_evaluacion: evaluacionData.fecha_fin,
            },
          });
        }
      }
      throw insertError;
    }

    const intento = nuevoIntento.rows[0];

    // Insertar las preguntas seleccionadas
    for (let i = 0; i < preguntasSeleccionadas.length; i++) {
      await db.query(
        'INSERT INTO preguntas_intento (intento_id, pregunta_id, orden_mostrado) VALUES ($1, $2, $3)',
        [intento.id, preguntasSeleccionadas[i].id, i]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Intento iniciado exitosamente',
      data: {
        intento_id: intento.id,
        numero_intento: intento.numero_intento,
        puntaje_total: intento.puntaje_total,
        fecha_inicio: intento.fecha_inicio,
        duracion_maxima_minutos: evaluacionData.duracion_maxima_minutos,
        fecha_fin_evaluacion: evaluacionData.fecha_fin,
      },
    });
  } catch (error) {
    console.error('Error al iniciar intento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar el intento',
      error: error.message,
    });
  }
};

/**
 * Obtener intento activo o preguntas de un intento
 * GET /api/intentos/:intento_id
 */
const obtenerIntento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { intento_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener el intento
    const intento = await db.query(
      `SELECT ie.*, e.titulo as evaluacion_titulo, e.mostrar_respuestas_correctas,
              e.duracion_maxima_minutos, e.fecha_fin as fecha_fin_evaluacion
       FROM intentos_evaluacion ie
       JOIN evaluaciones e ON ie.evaluacion_id = e.id
       WHERE ie.id = $1`,
      [intento_id]
    );

    if (intento.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Intento no encontrado',
      });
    }

    const intentoData = intento.rows[0];

    // Verificar permisos
    if (rol_activo === 'estudiante' && intentoData.estudiante_id !== usuario_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este intento',
      });
    }

    // Obtener preguntas del intento con sus detalles (sin información sensible)
    const preguntas = await db.query(
      `SELECT pb.id, pb.evaluacion_id, pb.tipo_pregunta, pb.enunciado,
              pb.puntaje, pb.orden, pb.fecha_creacion, pi.orden_mostrado
       FROM preguntas_intento pi
       JOIN preguntas_banco pb ON pi.pregunta_id = pb.id
       WHERE pi.intento_id = $1
       ORDER BY pi.orden_mostrado ASC`,
      [intento_id]
    );

    // Para cada pregunta, obtener opciones o respuesta correcta según tipo
    const preguntasCompletas = await Promise.all(
      preguntas.rows.map(async (pregunta) => {
        const preguntaData = { ...pregunta };

        // Obtener opciones para multiple choice
        if (pregunta.tipo_pregunta === 'multiple_choice') {
          const opciones = await db.query(
            `SELECT id, texto_opcion as texto, orden
             FROM opciones_pregunta
             WHERE pregunta_id = $1
             ORDER BY orden ASC`,
            [pregunta.id]
          );
          preguntaData.opciones = opciones.rows;
        }

        // Obtener respuesta del estudiante si existe
        const respuesta = await db.query(
          `SELECT * FROM respuestas_estudiante WHERE intento_id = $1 AND pregunta_id = $2`,
          [intento_id, pregunta.id]
        );

        if (respuesta.rows.length > 0) {
          preguntaData.respuesta_estudiante = respuesta.rows[0];

          // Si es multiple choice, obtener las opciones seleccionadas
          if (pregunta.tipo_pregunta === 'multiple_choice') {
            const opcionesSeleccionadas = await db.query(
              'SELECT opcion_id FROM opciones_seleccionadas_estudiante WHERE respuesta_id = $1',
              [respuesta.rows[0].id]
            );
            preguntaData.respuesta_estudiante.opciones_seleccionadas = opcionesSeleccionadas.rows.map(o => o.opcion_id);
          }
        }

        // Solo mostrar respuestas correctas si el intento está calificado/publicado
        if (
          (intentoData.estado === 'calificado' || intentoData.estado === 'publicado') &&
          intentoData.mostrar_respuestas_correctas
        ) {
          if (
            pregunta.tipo_pregunta === 'verdadero_falso' ||
            pregunta.tipo_pregunta === 'verdadero_falso_justificacion'
          ) {
            const respuestaCorrecta = await db.query(
              'SELECT respuesta_correcta FROM respuestas_correctas_vf WHERE pregunta_id = $1',
              [pregunta.id]
            );
            if (respuestaCorrecta.rows.length > 0) {
              preguntaData.respuesta_correcta = respuestaCorrecta.rows[0].respuesta_correcta;
            }
          } else if (pregunta.tipo_pregunta === 'multiple_choice') {
            // Marcar cuáles opciones son correctas
            const opcionesCorrectas = await db.query(
              'SELECT id FROM opciones_pregunta WHERE pregunta_id = $1 AND es_correcta = true',
              [pregunta.id]
            );
            preguntaData.opciones_correctas_ids = opcionesCorrectas.rows.map(o => o.id);
          }
        }

        return preguntaData;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        intento: intentoData,
        preguntas: preguntasCompletas,
      },
    });
  } catch (error) {
    console.error('Error al obtener intento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el intento',
      error: error.message,
    });
  }
};

/**
 * Guardar respuesta de una pregunta
 * POST /api/intentos/:intento_id/respuesta
 */
const guardarRespuesta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { intento_id } = req.params;
  const { pregunta_id, opcion_seleccionada_id, opciones_seleccionadas, respuesta_booleana, respuesta_texto, justificacion } = req.body;
  const estudiante_id = req.usuario.id;

  try {
    // Verificar que el intento existe y pertenece al estudiante
    const intento = await db.query(
      'SELECT * FROM intentos_evaluacion WHERE id = $1 AND estudiante_id = $2',
      [intento_id, estudiante_id]
    );

    if (intento.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Intento no encontrado',
      });
    }

    if (intento.rows[0].estado !== 'en_progreso') {
      return res.status(400).json({
        success: false,
        message: 'El intento ya fue entregado',
      });
    }

    // Verificar que la pregunta pertenece a este intento
    const preguntaIntento = await db.query(
      'SELECT * FROM preguntas_intento WHERE intento_id = $1 AND pregunta_id = $2',
      [intento_id, pregunta_id]
    );

    if (preguntaIntento.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Esta pregunta no pertenece a este intento',
      });
    }

    // Verificar si ya existe una respuesta
    const respuestaExistente = await db.query(
      'SELECT * FROM respuestas_estudiante WHERE intento_id = $1 AND pregunta_id = $2',
      [intento_id, pregunta_id]
    );

    let respuestaId;

    if (respuestaExistente.rows.length > 0) {
      // Actualizar respuesta existente
      await db.query(
        `UPDATE respuestas_estudiante
         SET respuesta_texto = $1, opcion_seleccionada_id = $2,
             respuesta_booleana = $3, justificacion = $4, fecha_respuesta = NOW()
         WHERE intento_id = $5 AND pregunta_id = $6`,
        [respuesta_texto || null, opcion_seleccionada_id || null, respuesta_booleana, justificacion || null, intento_id, pregunta_id]
      );
      respuestaId = respuestaExistente.rows[0].id;
    } else {
      // Crear nueva respuesta
      const nuevaRespuesta = await db.query(
        `INSERT INTO respuestas_estudiante
         (intento_id, pregunta_id, respuesta_texto, opcion_seleccionada_id, respuesta_booleana, justificacion)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [intento_id, pregunta_id, respuesta_texto || null, opcion_seleccionada_id || null, respuesta_booleana, justificacion || null]
      );
      respuestaId = nuevaRespuesta.rows[0].id;
    }

    // Si hay opciones seleccionadas (múltiple choice con múltiples selecciones)
    if (opciones_seleccionadas && Array.isArray(opciones_seleccionadas) && opciones_seleccionadas.length > 0) {
      // Primero eliminar las selecciones anteriores
      await db.query(
        'DELETE FROM opciones_seleccionadas_estudiante WHERE respuesta_id = $1',
        [respuestaId]
      );

      // Insertar las nuevas selecciones
      for (const opcionId of opciones_seleccionadas) {
        await db.query(
          `INSERT INTO opciones_seleccionadas_estudiante (respuesta_id, opcion_id)
           VALUES ($1, $2)
           ON CONFLICT (respuesta_id, opcion_id) DO NOTHING`,
          [respuestaId, opcionId]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Respuesta guardada exitosamente',
    });
  } catch (error) {
    console.error('Error al guardar respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la respuesta',
      error: error.message,
    });
  }
};

/**
 * Entregar intento
 * POST /api/intentos/:intento_id/entregar
 */
const entregarIntento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { intento_id } = req.params;
  const estudiante_id = req.usuario.id;

  try {
    // Verificar que el intento existe y pertenece al estudiante
    const intento = await db.query(
      `SELECT ie.*, e.nota_minima_aprobacion
       FROM intentos_evaluacion ie
       JOIN evaluaciones e ON ie.evaluacion_id = e.id
       WHERE ie.id = $1 AND ie.estudiante_id = $2`,
      [intento_id, estudiante_id]
    );

    if (intento.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Intento no encontrado',
      });
    }

    const intentoData = intento.rows[0];

    if (intentoData.estado !== 'en_progreso') {
      return res.status(400).json({
        success: false,
        message: 'El intento ya fue entregado',
      });
    }

    // Calcular tiempo usado
    const fechaInicio = new Date(intentoData.fecha_inicio);
    const ahora = new Date();
    const tiempoUsadoMs = ahora - fechaInicio;
    const tiempo_usado_minutos = Math.ceil(tiempoUsadoMs / 60000);

    // Obtener preguntas y calificar automáticamente
    const preguntas = await db.query(
      `SELECT pb.*, pi.orden_mostrado
       FROM preguntas_intento pi
       JOIN preguntas_banco pb ON pi.pregunta_id = pb.id
       WHERE pi.intento_id = $1`,
      [intento_id]
    );

    let puntajeObtenido = 0;
    let hayPreguntasManuales = false;

    for (const pregunta of preguntas.rows) {
      // Obtener respuesta del estudiante
      const respuesta = await db.query(
        'SELECT * FROM respuestas_estudiante WHERE intento_id = $1 AND pregunta_id = $2',
        [intento_id, pregunta.id]
      );

      if (respuesta.rows.length === 0) {
        // No respondió, puntaje 0
        await db.query(
          `INSERT INTO respuestas_estudiante
           (intento_id, pregunta_id, puntaje_obtenido, es_correcta)
           VALUES ($1, $2, 0, false)`,
          [intento_id, pregunta.id]
        );
        continue;
      }

      const respuestaData = respuesta.rows[0];

      // Calificar según tipo
      if (pregunta.tipo_pregunta === 'multiple_choice') {
        // Obtener todas las opciones correctas de la pregunta
        const opcionesCorrectas = await db.query(
          'SELECT id FROM opciones_pregunta WHERE pregunta_id = $1 AND es_correcta = true',
          [pregunta.id]
        );

        const opcionesCorrectasIds = opcionesCorrectas.rows.map(o => o.id);
        const totalOpcionesCorrectas = opcionesCorrectasIds.length;

        // Obtener opciones seleccionadas por el estudiante desde la nueva tabla
        const opcionesSeleccionadas = await db.query(
          'SELECT opcion_id FROM opciones_seleccionadas_estudiante WHERE respuesta_id = $1',
          [respuestaData.id]
        );

        let opcionesSeleccionadasIds = opcionesSeleccionadas.rows.map(o => o.opcion_id);

        // Si no hay opciones en la nueva tabla, usar el campo legacy opcion_seleccionada_id
        if (opcionesSeleccionadasIds.length === 0 && respuestaData.opcion_seleccionada_id) {
          opcionesSeleccionadasIds = [respuestaData.opcion_seleccionada_id];
        }

        if (opcionesSeleccionadasIds.length > 0 && totalOpcionesCorrectas > 0) {
          // Contar cuántas opciones correctas seleccionó
          const opcionesCorrectasSeleccionadas = opcionesSeleccionadasIds.filter(id =>
            opcionesCorrectasIds.includes(id)
          );

          // Calcular puntaje proporcional: (correctas seleccionadas / total correctas) * puntaje
          const puntajeProporcional = (opcionesCorrectasSeleccionadas.length / totalOpcionesCorrectas) * parseFloat(pregunta.puntaje);
          const esCorrecta = opcionesCorrectasSeleccionadas.length === totalOpcionesCorrectas && opcionesSeleccionadasIds.length === totalOpcionesCorrectas;

          puntajeObtenido += puntajeProporcional;
          await db.query(
            'UPDATE respuestas_estudiante SET puntaje_obtenido = $1, es_correcta = $2 WHERE id = $3',
            [puntajeProporcional, esCorrecta, respuestaData.id]
          );
        } else {
          await db.query(
            'UPDATE respuestas_estudiante SET puntaje_obtenido = 0, es_correcta = false WHERE id = $1',
            [respuestaData.id]
          );
        }
      } else if (pregunta.tipo_pregunta === 'verdadero_falso') {
        // Verificar respuesta correcta
        const respuestaCorrecta = await db.query(
          'SELECT respuesta_correcta FROM respuestas_correctas_vf WHERE pregunta_id = $1',
          [pregunta.id]
        );

        if (
          respuestaCorrecta.rows.length > 0 &&
          respuestaData.respuesta_booleana === respuestaCorrecta.rows[0].respuesta_correcta
        ) {
          puntajeObtenido += parseFloat(pregunta.puntaje);
          await db.query(
            'UPDATE respuestas_estudiante SET puntaje_obtenido = $1, es_correcta = true WHERE id = $2',
            [pregunta.puntaje, respuestaData.id]
          );
        } else {
          await db.query(
            'UPDATE respuestas_estudiante SET puntaje_obtenido = 0, es_correcta = false WHERE id = $1',
            [respuestaData.id]
          );
        }
      } else {
        // Desarrollo o V/F con justificación: requiere calificación manual
        hayPreguntasManuales = true;
      }
    }

    // Calcular nota
    const nota_obtenida =
      intentoData.puntaje_total > 0 ? (puntajeObtenido / intentoData.puntaje_total) * 10 : 0;

    // Determinar estado final
    const estadoFinal = hayPreguntasManuales ? 'entregado' : 'calificado';

    // Actualizar intento
    await db.query(
      `UPDATE intentos_evaluacion
       SET fecha_entrega = NOW(), tiempo_usado_minutos = $1, estado = $2,
           puntaje_obtenido = $3, nota_obtenida = $4, fecha_calificacion = $5
       WHERE id = $6`,
      [
        tiempo_usado_minutos,
        estadoFinal,
        puntajeObtenido,
        nota_obtenida,
        hayPreguntasManuales ? null : new Date(),
        intento_id,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Intento entregado exitosamente',
      data: {
        estado: estadoFinal,
        puntaje_obtenido: puntajeObtenido,
        puntaje_total: intentoData.puntaje_total,
        nota_obtenida: hayPreguntasManuales ? null : nota_obtenida.toFixed(2),
        requiere_calificacion_manual: hayPreguntasManuales,
      },
    });
  } catch (error) {
    console.error('Error al entregar intento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al entregar el intento',
      error: error.message,
    });
  }
};

/**
 * Obtener intentos de un estudiante en una evaluación
 * GET /api/intentos/evaluacion/:evaluacion_id/mis-intentos
 */
const obtenerMisIntentos = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { evaluacion_id } = req.params;
  const estudiante_id = req.usuario.id;

  try {
    const intentos = await db.query(
      `SELECT * FROM intentos_evaluacion
       WHERE evaluacion_id = $1 AND estudiante_id = $2
       ORDER BY numero_intento DESC`,
      [evaluacion_id, estudiante_id]
    );

    res.status(200).json({
      success: true,
      data: intentos.rows,
    });
  } catch (error) {
    console.error('Error al obtener intentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los intentos',
      error: error.message,
    });
  }
};

/**
 * Obtener intentos pendientes de calificación de una evaluación
 * GET /api/intentos/evaluacion/:evaluacion_id/pendientes
 */
const obtenerIntentosPendientes = async (req, res) => {
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
    // Verificar que el usuario es profesor del aula
    const evaluacion = await db.query(
      'SELECT e.*, a.id as aula_id FROM evaluaciones e JOIN aulas a ON e.aula_id = a.id WHERE e.id = $1',
      [evaluacion_id]
    );

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evaluación no encontrada',
      });
    }

    const evaluacionData = evaluacion.rows[0];

    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver estos intentos',
        });
      }
    }

    // Obtener todos los intentos entregados o calificados
    const intentos = await db.query(
      `SELECT ie.*,
              u.nombre || ' ' || u.apellido as estudiante_nombre,
              u.email as estudiante_email
       FROM intentos_evaluacion ie
       JOIN usuarios u ON ie.estudiante_id = u.id
       WHERE ie.evaluacion_id = $1 AND ie.estado IN ('entregado', 'calificado')
       ORDER BY ie.estado ASC, ie.fecha_entrega DESC`,
      [evaluacion_id]
    );

    res.status(200).json({
      success: true,
      data: intentos.rows,
    });
  } catch (error) {
    console.error('Error al obtener intentos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los intentos',
      error: error.message,
    });
  }
};

/**
 * Obtener intento para calificar (con todas las respuestas y preguntas)
 * GET /api/intentos/:intento_id/calificar
 */
const obtenerIntentoParaCalificar = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { intento_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener el intento con información del estudiante
    const intento = await db.query(
      `SELECT ie.*, e.titulo as evaluacion_titulo, e.aula_id,
              u.nombre || ' ' || u.apellido as estudiante_nombre,
              u.email as estudiante_email
       FROM intentos_evaluacion ie
       JOIN evaluaciones e ON ie.evaluacion_id = e.id
       JOIN usuarios u ON ie.estudiante_id = u.id
       WHERE ie.id = $1`,
      [intento_id]
    );

    if (intento.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Intento no encontrado',
      });
    }

    const intentoData = intento.rows[0];

    // Verificar permisos
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [intentoData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para calificar este intento',
        });
      }
    }

    // Obtener preguntas con sus respuestas
    const preguntas = await db.query(
      `SELECT pb.*, pi.orden_mostrado
       FROM preguntas_intento pi
       JOIN preguntas_banco pb ON pi.pregunta_id = pb.id
       WHERE pi.intento_id = $1
       ORDER BY pi.orden_mostrado ASC`,
      [intento_id]
    );

    // Para cada pregunta, obtener opciones, respuesta correcta y respuesta del estudiante
    const preguntasCompletas = await Promise.all(
      preguntas.rows.map(async (pregunta) => {
        const preguntaData = { ...pregunta };

        // Obtener opciones para multiple choice
        if (pregunta.tipo_pregunta === 'multiple_choice') {
          const opciones = await db.query(
            `SELECT id, texto_opcion as texto, es_correcta, orden
             FROM opciones_pregunta
             WHERE pregunta_id = $1
             ORDER BY orden ASC`,
            [pregunta.id]
          );
          preguntaData.opciones = opciones.rows;
        }

        // Obtener respuesta correcta para V/F
        if (
          pregunta.tipo_pregunta === 'verdadero_falso' ||
          pregunta.tipo_pregunta === 'verdadero_falso_justificacion'
        ) {
          const respuestaCorrecta = await db.query(
            'SELECT respuesta_correcta FROM respuestas_correctas_vf WHERE pregunta_id = $1',
            [pregunta.id]
          );
          if (respuestaCorrecta.rows.length > 0) {
            preguntaData.respuesta_correcta = respuestaCorrecta.rows[0].respuesta_correcta;
          }
        }

        // Obtener respuesta del estudiante
        const respuesta = await db.query(
          `SELECT * FROM respuestas_estudiante WHERE intento_id = $1 AND pregunta_id = $2`,
          [intento_id, pregunta.id]
        );

        if (respuesta.rows.length > 0) {
          preguntaData.respuesta_estudiante = respuesta.rows[0];

          // Si es multiple choice, obtener las opciones seleccionadas
          if (pregunta.tipo_pregunta === 'multiple_choice') {
            const opcionesSeleccionadas = await db.query(
              'SELECT opcion_id FROM opciones_seleccionadas_estudiante WHERE respuesta_id = $1',
              [respuesta.rows[0].id]
            );
            preguntaData.respuesta_estudiante.opciones_seleccionadas = opcionesSeleccionadas.rows.map(o => o.opcion_id);
          }
        }

        return preguntaData;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        intento: intentoData,
        preguntas: preguntasCompletas,
      },
    });
  } catch (error) {
    console.error('Error al obtener intento para calificar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el intento',
      error: error.message,
    });
  }
};

/**
 * Calificar una respuesta individual
 * PUT /api/intentos/:intento_id/respuesta/:respuesta_id/calificar
 */
const calificarRespuesta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { intento_id, respuesta_id } = req.params;
  const { puntaje_obtenido, retroalimentacion } = req.body;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Verificar que el intento existe
    const intento = await db.query(
      `SELECT ie.*, e.aula_id FROM intentos_evaluacion ie
       JOIN evaluaciones e ON ie.evaluacion_id = e.id
       WHERE ie.id = $1`,
      [intento_id]
    );

    if (intento.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Intento no encontrado',
      });
    }

    const intentoData = intento.rows[0];

    // Verificar permisos
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [intentoData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para calificar este intento',
        });
      }
    }

    // Verificar que la respuesta existe y pertenece al intento
    const respuesta = await db.query(
      'SELECT * FROM respuestas_estudiante WHERE id = $1 AND intento_id = $2',
      [respuesta_id, intento_id]
    );

    if (respuesta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Respuesta no encontrada',
      });
    }

    // Obtener la pregunta para validar el puntaje máximo
    const pregunta = await db.query(
      'SELECT puntaje FROM preguntas_banco WHERE id = $1',
      [respuesta.rows[0].pregunta_id]
    );

    if (parseFloat(puntaje_obtenido) > parseFloat(pregunta.rows[0].puntaje)) {
      return res.status(400).json({
        success: false,
        message: `El puntaje no puede ser mayor a ${pregunta.rows[0].puntaje}`,
      });
    }

    // Actualizar la respuesta
    await db.query(
      `UPDATE respuestas_estudiante
       SET puntaje_obtenido = $1::numeric, retroalimentacion_profesor = $2,
           es_correcta = CASE WHEN $1::numeric > 0 THEN true ELSE false END,
           fecha_calificacion = NOW()
       WHERE id = $3`,
      [parseFloat(puntaje_obtenido), retroalimentacion || null, respuesta_id]
    );

    res.status(200).json({
      success: true,
      message: 'Respuesta calificada exitosamente',
    });
  } catch (error) {
    console.error('Error al calificar respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calificar la respuesta',
      error: error.message,
    });
  }
};

/**
 * Publicar resultados del intento (recalcular nota y cambiar estado a 'calificado')
 * POST /api/intentos/:intento_id/publicar
 */
const publicarResultados = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { intento_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Verificar que el intento existe
    const intento = await db.query(
      `SELECT ie.*, e.aula_id FROM intentos_evaluacion ie
       JOIN evaluaciones e ON ie.evaluacion_id = e.id
       WHERE ie.id = $1`,
      [intento_id]
    );

    if (intento.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Intento no encontrado',
      });
    }

    const intentoData = intento.rows[0];

    // Verificar permisos
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [intentoData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para publicar este intento',
        });
      }
    }

    // Verificar que todas las respuestas estén calificadas
    const respuestasSinCalificar = await db.query(
      `SELECT COUNT(*) as total
       FROM respuestas_estudiante re
       JOIN preguntas_banco pb ON re.pregunta_id = pb.id
       WHERE re.intento_id = $1
         AND pb.tipo_pregunta IN ('desarrollo', 'verdadero_falso_justificacion')
         AND re.puntaje_obtenido IS NULL`,
      [intento_id]
    );

    if (parseInt(respuestasSinCalificar.rows[0].total) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Hay respuestas pendientes de calificación',
      });
    }

    // Recalcular puntaje total obtenido
    const puntajeResult = await db.query(
      `SELECT COALESCE(SUM(puntaje_obtenido), 0) as puntaje_total
       FROM respuestas_estudiante
       WHERE intento_id = $1`,
      [intento_id]
    );

    const puntajeObtenido = parseFloat(puntajeResult.rows[0].puntaje_total);
    const nota_obtenida =
      intentoData.puntaje_total > 0 ? (puntajeObtenido / intentoData.puntaje_total) * 10 : 0;

    // Actualizar intento
    await db.query(
      `UPDATE intentos_evaluacion
       SET estado = 'calificado', puntaje_obtenido = $1, nota_obtenida = $2,
           fecha_calificacion = NOW()
       WHERE id = $3`,
      [puntajeObtenido, nota_obtenida, intento_id]
    );

    res.status(200).json({
      success: true,
      message: 'Resultados publicados exitosamente',
      data: {
        puntaje_obtenido: puntajeObtenido,
        nota_obtenida: nota_obtenida.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Error al publicar resultados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al publicar los resultados',
      error: error.message,
    });
  }
};

module.exports = {
  iniciarIntento,
  obtenerIntento,
  guardarRespuesta,
  entregarIntento,
  obtenerMisIntentos,
  obtenerIntentosPendientes,
  obtenerIntentoParaCalificar,
  calificarRespuesta,
  publicarResultados,
};
