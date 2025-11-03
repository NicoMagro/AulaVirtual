const db = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Crear una nueva pregunta en el banco
 * POST /api/preguntas
 */
const crearPregunta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const {
    evaluacion_id,
    tipo_pregunta,
    enunciado,
    puntaje,
    orden,
    requiere_justificacion,
    opciones, // Array de opciones para multiple_choice
    respuesta_correcta, // Boolean para verdadero_falso
  } = req.body;

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

    // Verificar permisos
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para crear preguntas en esta evaluación',
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
        message: 'No se pueden agregar preguntas a una evaluación que ya tiene intentos entregados',
      });
    }

    // Validar tipo_pregunta
    const tiposValidos = ['multiple_choice', 'verdadero_falso', 'verdadero_falso_justificacion', 'desarrollo'];
    if (!tiposValidos.includes(tipo_pregunta)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de pregunta inválido',
      });
    }

    // Insertar la pregunta
    const resultado = await db.query(
      `INSERT INTO preguntas_banco
       (evaluacion_id, tipo_pregunta, enunciado, puntaje, orden, requiere_justificacion)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        evaluacion_id,
        tipo_pregunta,
        enunciado,
        puntaje || 1.0,
        orden || 0,
        requiere_justificacion || false,
      ]
    );

    const pregunta = resultado.rows[0];

    // Si es múltiple choice, insertar opciones
    if (tipo_pregunta === 'multiple_choice') {
      if (!opciones || !Array.isArray(opciones) || opciones.length < 2) {
        // Eliminar la pregunta creada
        await db.query('DELETE FROM preguntas_banco WHERE id = $1', [pregunta.id]);
        return res.status(400).json({
          success: false,
          message: 'Las preguntas de múltiple choice deben tener al menos 2 opciones',
        });
      }

      // Validar que haya al menos una opción correcta
      const hayCorrecta = opciones.some(op => op.es_correcta);
      if (!hayCorrecta) {
        await db.query('DELETE FROM preguntas_banco WHERE id = $1', [pregunta.id]);
        return res.status(400).json({
          success: false,
          message: 'Debe haber al menos una opción correcta',
        });
      }

      // Insertar opciones
      for (const opcion of opciones) {
        await db.query(
          `INSERT INTO opciones_pregunta (pregunta_id, texto_opcion, es_correcta, orden)
           VALUES ($1, $2, $3, $4)`,
          [pregunta.id, opcion.texto, opcion.es_correcta || false, opcion.orden || 0]
        );
      }
    }

    // Si es verdadero/falso (con o sin justificación), insertar respuesta correcta
    if (tipo_pregunta === 'verdadero_falso' || tipo_pregunta === 'verdadero_falso_justificacion') {
      if (respuesta_correcta === undefined || respuesta_correcta === null) {
        await db.query('DELETE FROM preguntas_banco WHERE id = $1', [pregunta.id]);
        return res.status(400).json({
          success: false,
          message: 'Debe especificar la respuesta correcta (true o false)',
        });
      }

      await db.query(
        `INSERT INTO respuestas_correctas_vf (pregunta_id, respuesta_correcta)
         VALUES ($1, $2)`,
        [pregunta.id, respuesta_correcta]
      );
    }

    // Obtener la pregunta completa con sus relaciones
    const preguntaCompleta = await obtenerPreguntaCompleta(pregunta.id);

    res.status(201).json({
      success: true,
      message: 'Pregunta creada exitosamente',
      data: preguntaCompleta,
    });
  } catch (error) {
    console.error('Error al crear pregunta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la pregunta',
      error: error.message,
    });
  }
};

/**
 * Obtener todas las preguntas de una evaluación
 * GET /api/preguntas/evaluacion/:evaluacion_id
 */
const obtenerPreguntasEvaluacion = async (req, res) => {
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

    // Verificar acceso
    let tieneAcceso = false;

    if (rol_activo === 'admin') {
      tieneAcceso = true;
    } else if (rol_activo === 'profesor') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );
      tieneAcceso = esProfesor.rows.length > 0;
    }

    if (!tieneAcceso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver las preguntas de esta evaluación',
      });
    }

    // Obtener preguntas
    const preguntas = await db.query(
      `SELECT * FROM preguntas_banco
       WHERE evaluacion_id = $1
       ORDER BY orden ASC, fecha_creacion ASC`,
      [evaluacion_id]
    );

    // Para cada pregunta, obtener sus opciones o respuesta correcta
    const preguntasCompletas = await Promise.all(
      preguntas.rows.map(async (pregunta) => {
        return await obtenerPreguntaCompleta(pregunta.id);
      })
    );

    res.status(200).json({
      success: true,
      data: preguntasCompletas,
      total: preguntasCompletas.length,
    });
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las preguntas',
      error: error.message,
    });
  }
};

/**
 * Obtener detalle de una pregunta específica
 * GET /api/preguntas/:pregunta_id
 */
const obtenerPreguntaDetalle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { pregunta_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la pregunta
    const pregunta = await db.query('SELECT * FROM preguntas_banco WHERE id = $1', [pregunta_id]);

    if (pregunta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
      });
    }

    const preguntaData = pregunta.rows[0];

    // Obtener la evaluación para verificar permisos
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [preguntaData.evaluacion_id]);
    const evaluacionData = evaluacion.rows[0];

    // Verificar acceso
    let tieneAcceso = false;

    if (rol_activo === 'admin') {
      tieneAcceso = true;
    } else if (rol_activo === 'profesor') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );
      tieneAcceso = esProfesor.rows.length > 0;
    }

    if (!tieneAcceso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta pregunta',
      });
    }

    // Obtener pregunta completa
    const preguntaCompleta = await obtenerPreguntaCompleta(pregunta_id);

    res.status(200).json({
      success: true,
      data: preguntaCompleta,
    });
  } catch (error) {
    console.error('Error al obtener pregunta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la pregunta',
      error: error.message,
    });
  }
};

/**
 * Actualizar una pregunta
 * PUT /api/preguntas/:pregunta_id
 */
const actualizarPregunta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { pregunta_id } = req.params;
  const {
    enunciado,
    puntaje,
    orden,
    requiere_justificacion,
    opciones,
    respuesta_correcta,
  } = req.body;

  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la pregunta
    const pregunta = await db.query('SELECT * FROM preguntas_banco WHERE id = $1', [pregunta_id]);

    if (pregunta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
      });
    }

    const preguntaData = pregunta.rows[0];

    // Obtener la evaluación para verificar permisos
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [preguntaData.evaluacion_id]);
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
          message: 'No tienes permiso para editar esta pregunta',
        });
      }
    }

    // Verificar si ya hay intentos entregados
    const hayIntentos = await db.query(
      `SELECT COUNT(*) as total FROM intentos_evaluacion
       WHERE evaluacion_id = $1 AND estado != 'en_progreso'`,
      [preguntaData.evaluacion_id]
    );

    if (parseInt(hayIntentos.rows[0].total) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una pregunta de una evaluación que ya tiene intentos entregados',
      });
    }

    // Actualizar campos básicos
    const campos = [];
    const valores = [];
    let index = 1;

    if (enunciado !== undefined) {
      campos.push(`enunciado = $${index++}`);
      valores.push(enunciado);
    }
    if (puntaje !== undefined) {
      campos.push(`puntaje = $${index++}`);
      valores.push(puntaje);
    }
    if (orden !== undefined) {
      campos.push(`orden = $${index++}`);
      valores.push(orden);
    }
    if (requiere_justificacion !== undefined) {
      campos.push(`requiere_justificacion = $${index++}`);
      valores.push(requiere_justificacion);
    }

    if (campos.length > 0) {
      valores.push(pregunta_id);
      const query = `UPDATE preguntas_banco SET ${campos.join(', ')} WHERE id = $${index}`;
      await db.query(query, valores);
    }

    // Actualizar opciones si es múltiple choice
    if (preguntaData.tipo_pregunta === 'multiple_choice' && opciones) {
      if (!Array.isArray(opciones) || opciones.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Las preguntas de múltiple choice deben tener al menos 2 opciones',
        });
      }

      // Validar que haya al menos una opción correcta
      const hayCorrecta = opciones.some(op => op.es_correcta);
      if (!hayCorrecta) {
        return res.status(400).json({
          success: false,
          message: 'Debe haber al menos una opción correcta',
        });
      }

      // Eliminar opciones existentes
      await db.query('DELETE FROM opciones_pregunta WHERE pregunta_id = $1', [pregunta_id]);

      // Insertar nuevas opciones
      for (const opcion of opciones) {
        await db.query(
          `INSERT INTO opciones_pregunta (pregunta_id, texto_opcion, es_correcta, orden)
           VALUES ($1, $2, $3, $4)`,
          [pregunta_id, opcion.texto, opcion.es_correcta || false, opcion.orden || 0]
        );
      }
    }

    // Actualizar respuesta correcta si es verdadero/falso
    if (
      (preguntaData.tipo_pregunta === 'verdadero_falso' ||
       preguntaData.tipo_pregunta === 'verdadero_falso_justificacion') &&
      respuesta_correcta !== undefined
    ) {
      await db.query(
        `UPDATE respuestas_correctas_vf SET respuesta_correcta = $1 WHERE pregunta_id = $2`,
        [respuesta_correcta, pregunta_id]
      );
    }

    // Obtener pregunta completa actualizada
    const preguntaCompleta = await obtenerPreguntaCompleta(pregunta_id);

    res.status(200).json({
      success: true,
      message: 'Pregunta actualizada exitosamente',
      data: preguntaCompleta,
    });
  } catch (error) {
    console.error('Error al actualizar pregunta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la pregunta',
      error: error.message,
    });
  }
};

/**
 * Eliminar una pregunta
 * DELETE /api/preguntas/:pregunta_id
 */
const eliminarPregunta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { pregunta_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la pregunta
    const pregunta = await db.query('SELECT * FROM preguntas_banco WHERE id = $1', [pregunta_id]);

    if (pregunta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
      });
    }

    const preguntaData = pregunta.rows[0];

    // Obtener la evaluación para verificar permisos
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [preguntaData.evaluacion_id]);
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
          message: 'No tienes permiso para eliminar esta pregunta',
        });
      }
    }

    // Verificar si ya hay intentos entregados
    const hayIntentos = await db.query(
      `SELECT COUNT(*) as total FROM intentos_evaluacion
       WHERE evaluacion_id = $1 AND estado != 'en_progreso'`,
      [preguntaData.evaluacion_id]
    );

    if (parseInt(hayIntentos.rows[0].total) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una pregunta de una evaluación que ya tiene intentos entregados',
      });
    }

    // Obtener todas las imágenes de la pregunta
    const imagenesPregunta = await db.query(
      'SELECT nombre_archivo FROM imagenes_preguntas WHERE pregunta_id = $1',
      [pregunta_id]
    );

    // Obtener todas las imágenes de las opciones de la pregunta
    const imagenesOpciones = await db.query(
      `SELECT io.nombre_archivo
       FROM imagenes_opciones io
       JOIN opciones_pregunta op ON io.opcion_id = op.id
       WHERE op.pregunta_id = $1`,
      [pregunta_id]
    );

    // Combinar todas las imágenes a eliminar
    const todasLasImagenes = [...imagenesPregunta.rows, ...imagenesOpciones.rows];

    // Eliminar archivos físicos
    for (const imagen of todasLasImagenes) {
      const filePath = path.join(__dirname, '../../uploads/evaluaciones', imagen.nombre_archivo);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error al eliminar archivo físico:', error);
        // Continuar con la eliminación aunque falle un archivo
      }
    }

    // Eliminar la pregunta (cascade eliminará opciones, imágenes y respuestas)
    await db.query('DELETE FROM preguntas_banco WHERE id = $1', [pregunta_id]);

    res.status(200).json({
      success: true,
      message: 'Pregunta eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar pregunta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la pregunta',
      error: error.message,
    });
  }
};

// ============================================
// Función auxiliar
// ============================================

/**
 * Obtener pregunta completa con sus relaciones
 * (opciones para multiple_choice, respuesta correcta para V/F, imágenes)
 */
async function obtenerPreguntaCompleta(pregunta_id) {
  const pregunta = await db.query('SELECT * FROM preguntas_banco WHERE id = $1', [pregunta_id]);

  if (pregunta.rows.length === 0) {
    return null;
  }

  const preguntaData = pregunta.rows[0];
  const resultado = { ...preguntaData };

  // Obtener imágenes de la pregunta
  const imagenesPregunta = await db.query(
    'SELECT * FROM imagenes_preguntas WHERE pregunta_id = $1 ORDER BY fecha_subida ASC',
    [pregunta_id]
  );
  resultado.imagenes = imagenesPregunta.rows;

  // Si es múltiple choice, obtener opciones e imágenes de cada opción
  if (preguntaData.tipo_pregunta === 'multiple_choice') {
    const opciones = await db.query(
      `SELECT id, texto_opcion as texto, es_correcta, orden
       FROM opciones_pregunta
       WHERE pregunta_id = $1
       ORDER BY orden ASC`,
      [pregunta_id]
    );

    // Para cada opción, obtener sus imágenes
    const opcionesConImagenes = await Promise.all(
      opciones.rows.map(async (opcion) => {
        const imagenesOpcion = await db.query(
          'SELECT * FROM imagenes_opciones WHERE opcion_id = $1 ORDER BY fecha_subida ASC',
          [opcion.id]
        );
        return {
          ...opcion,
          imagenes: imagenesOpcion.rows,
        };
      })
    );

    resultado.opciones = opcionesConImagenes;
  }

  // Si es verdadero/falso, obtener respuesta correcta
  if (
    preguntaData.tipo_pregunta === 'verdadero_falso' ||
    preguntaData.tipo_pregunta === 'verdadero_falso_justificacion'
  ) {
    const respuesta = await db.query(
      'SELECT respuesta_correcta FROM respuestas_correctas_vf WHERE pregunta_id = $1',
      [pregunta_id]
    );
    if (respuesta.rows.length > 0) {
      resultado.respuesta_correcta = respuesta.rows[0].respuesta_correcta;
    }
  }

  return resultado;
}

// ============================================
// GESTIÓN DE IMÁGENES EN PREGUNTAS Y OPCIONES
// ============================================

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configuración de multer para imágenes de evaluaciones
const storageImagenes = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/evaluaciones');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// Filtro para validar que solo sean imágenes
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)`), false);
  }
};

// Configuración de multer para imágenes
const uploadImagen = multer({
  storage: storageImagenes,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10485760, // 10 MB en bytes
  },
});

/**
 * Middleware de multer para subir una imagen
 */
const subirImagenMiddleware = uploadImagen.single('imagen');

/**
 * Subir una imagen a una pregunta
 * POST /api/preguntas/:pregunta_id/imagen
 */
const subirImagenPregunta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { pregunta_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se proporcionó ninguna imagen',
    });
  }

  try {
    // Verificar que la pregunta existe
    const pregunta = await db.query('SELECT * FROM preguntas_banco WHERE id = $1', [pregunta_id]);

    if (pregunta.rows.length === 0) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
      });
    }

    const preguntaData = pregunta.rows[0];

    // Obtener la evaluación para verificar permisos
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [preguntaData.evaluacion_id]);
    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos (solo profesores del aula o admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para subir imágenes a esta pregunta',
        });
      }
    }

    // Insertar registro en la base de datos
    const resultado = await db.query(
      `INSERT INTO imagenes_preguntas
       (pregunta_id, nombre_original, nombre_archivo, tipo_mime, tamano_bytes, subido_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        pregunta_id,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        usuario_id,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al subir imagen de pregunta:', error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen',
      error: error.message,
    });
  }
};

/**
 * Obtener imágenes de una pregunta
 * GET /api/preguntas/:pregunta_id/imagenes
 */
const obtenerImagenesPregunta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { pregunta_id } = req.params;

  try {
    // Verificar que la pregunta existe
    const pregunta = await db.query('SELECT * FROM preguntas_banco WHERE id = $1', [pregunta_id]);

    if (pregunta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
      });
    }

    // Obtener imágenes
    const imagenes = await db.query(
      `SELECT
        ip.*,
        u.nombre || ' ' || u.apellido as subido_por_nombre
      FROM imagenes_preguntas ip
      LEFT JOIN usuarios u ON ip.subido_por = u.id
      WHERE ip.pregunta_id = $1
      ORDER BY ip.fecha_subida ASC`,
      [pregunta_id]
    );

    res.status(200).json({
      success: true,
      data: imagenes.rows,
    });
  } catch (error) {
    console.error('Error al obtener imágenes de pregunta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las imágenes',
      error: error.message,
    });
  }
};

/**
 * Eliminar una imagen de una pregunta
 * DELETE /api/preguntas/imagenes/:imagen_id
 */
const eliminarImagenPregunta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { imagen_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener información de la imagen
    const imagen = await db.query(
      'SELECT ip.*, pb.evaluacion_id FROM imagenes_preguntas ip JOIN preguntas_banco pb ON ip.pregunta_id = pb.id WHERE ip.id = $1',
      [imagen_id]
    );

    if (imagen.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada',
      });
    }

    const imagenData = imagen.rows[0];

    // Obtener la evaluación para verificar permisos
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [imagenData.evaluacion_id]);
    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos (solo profesores del aula o admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta imagen',
        });
      }
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../uploads/evaluaciones', imagenData.nombre_archivo);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
    }

    // Eliminar registro de la base de datos
    await db.query('DELETE FROM imagenes_preguntas WHERE id = $1', [imagen_id]);

    res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar imagen de pregunta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la imagen',
      error: error.message,
    });
  }
};

/**
 * Subir una imagen a una opción de pregunta
 * POST /api/preguntas/opciones/:opcion_id/imagen
 */
const subirImagenOpcion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { opcion_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se proporcionó ninguna imagen',
    });
  }

  try {
    // Verificar que la opción existe
    const opcion = await db.query(
      'SELECT op.*, pb.evaluacion_id FROM opciones_pregunta op JOIN preguntas_banco pb ON op.pregunta_id = pb.id WHERE op.id = $1',
      [opcion_id]
    );

    if (opcion.rows.length === 0) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({
        success: false,
        message: 'Opción no encontrada',
      });
    }

    const opcionData = opcion.rows[0];

    // Obtener la evaluación para verificar permisos
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [opcionData.evaluacion_id]);
    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos (solo profesores del aula o admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para subir imágenes a esta opción',
        });
      }
    }

    // Insertar registro en la base de datos
    const resultado = await db.query(
      `INSERT INTO imagenes_opciones
       (opcion_id, nombre_original, nombre_archivo, tipo_mime, tamano_bytes, subido_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        opcion_id,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        usuario_id,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al subir imagen de opción:', error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({
      success: false,
      message: 'Error al subir la imagen',
      error: error.message,
    });
  }
};

/**
 * Obtener imágenes de una opción
 * GET /api/preguntas/opciones/:opcion_id/imagenes
 */
const obtenerImagenesOpcion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { opcion_id } = req.params;

  try {
    // Verificar que la opción existe
    const opcion = await db.query('SELECT * FROM opciones_pregunta WHERE id = $1', [opcion_id]);

    if (opcion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Opción no encontrada',
      });
    }

    // Obtener imágenes
    const imagenes = await db.query(
      `SELECT
        io.*,
        u.nombre || ' ' || u.apellido as subido_por_nombre
      FROM imagenes_opciones io
      LEFT JOIN usuarios u ON io.subido_por = u.id
      WHERE io.opcion_id = $1
      ORDER BY io.fecha_subida ASC`,
      [opcion_id]
    );

    res.status(200).json({
      success: true,
      data: imagenes.rows,
    });
  } catch (error) {
    console.error('Error al obtener imágenes de opción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las imágenes',
      error: error.message,
    });
  }
};

/**
 * Eliminar una imagen de una opción
 * DELETE /api/preguntas/opciones/imagenes/:imagen_id
 */
const eliminarImagenOpcion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { imagen_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener información de la imagen
    const imagen = await db.query(
      'SELECT io.*, pb.evaluacion_id FROM imagenes_opciones io JOIN opciones_pregunta op ON io.opcion_id = op.id JOIN preguntas_banco pb ON op.pregunta_id = pb.id WHERE io.id = $1',
      [imagen_id]
    );

    if (imagen.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada',
      });
    }

    const imagenData = imagen.rows[0];

    // Obtener la evaluación para verificar permisos
    const evaluacion = await db.query('SELECT * FROM evaluaciones WHERE id = $1', [imagenData.evaluacion_id]);
    const evaluacionData = evaluacion.rows[0];

    // Verificar permisos (solo profesores del aula o admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [evaluacionData.aula_id, usuario_id]
      );

      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta imagen',
        });
      }
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../uploads/evaluaciones', imagenData.nombre_archivo);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
    }

    // Eliminar registro de la base de datos
    await db.query('DELETE FROM imagenes_opciones WHERE id = $1', [imagen_id]);

    res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar imagen de opción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la imagen',
      error: error.message,
    });
  }
};

module.exports = {
  crearPregunta,
  obtenerPreguntasEvaluacion,
  obtenerPreguntaDetalle,
  actualizarPregunta,
  eliminarPregunta,
  // Imágenes
  subirImagenMiddleware,
  subirImagenPregunta,
  obtenerImagenesPregunta,
  eliminarImagenPregunta,
  subirImagenOpcion,
  obtenerImagenesOpcion,
  eliminarImagenOpcion,
};
