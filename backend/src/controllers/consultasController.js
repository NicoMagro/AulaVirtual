const db = require('../config/database');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configuración de multer para imágenes
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/consultas');
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

// Filtro para validar tipos de imagen permitidos
const imageFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de imagen no permitido: ${file.mimetype}`), false);
  }
};

// Configuración de multer para imágenes
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10485760, // 10 MB
  },
});

/**
 * Middleware de multer para subir una imagen
 */
const subirImagenMiddleware = uploadImage.single('imagen');

/**
 * Crear una nueva consulta
 * POST /api/consultas
 * Body: { aula_id, titulo, pregunta, publica, hoja_id?, bloque_id?, archivo_id? }
 * Accesible por estudiantes y profesores del aula
 */
const crearConsulta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { aula_id, titulo, pregunta, publica, hoja_id, bloque_id, archivo_id } = req.body;
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

    // Validar referencias opcionales si se proporcionan
    if (hoja_id) {
      const hojaExiste = await db.query(
        'SELECT id FROM hojas_aula WHERE id = $1 AND aula_id = $2',
        [hoja_id, aula_id]
      );
      if (hojaExiste.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'La hoja referenciada no existe o no pertenece al aula',
        });
      }
    }

    if (bloque_id) {
      const bloqueExiste = await db.query(
        'SELECT id FROM contenido_aulas WHERE id = $1 AND aula_id = $2',
        [bloque_id, aula_id]
      );
      if (bloqueExiste.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'El bloque referenciado no existe o no pertenece al aula',
        });
      }
    }

    if (archivo_id) {
      const archivoExiste = await db.query(
        'SELECT id FROM archivos_aula WHERE id = $1 AND aula_id = $2',
        [archivo_id, aula_id]
      );
      if (archivoExiste.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'El archivo referenciado no existe o no pertenece al aula',
        });
      }
    }

    // Insertar la consulta
    const resultado = await db.query(
      `INSERT INTO consultas
       (aula_id, hoja_id, bloque_id, archivo_id, creado_por, titulo, pregunta, publica)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        aula_id,
        hoja_id || null,
        bloque_id || null,
        archivo_id || null,
        usuario_id,
        titulo,
        pregunta,
        publica !== false, // Default true si no se especifica
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Consulta creada exitosamente',
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al crear consulta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la consulta',
      error: error.message,
    });
  }
};

/**
 * Obtener consultas de un aula
 * GET /api/consultas/aula/:aula_id
 * Accesible por profesores y estudiantes del aula
 * Estudiantes solo ven: consultas públicas + sus propias consultas privadas
 * Profesores ven: todas las consultas
 */
const obtenerConsultasAula = async (req, res) => {
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

    // Construir query con filtros de visibilidad
    let query = `
      SELECT
        c.*,
        u.nombre || ' ' || u.apellido as creado_por_nombre,
        u.email as creado_por_email,
        (SELECT COUNT(*) FROM respuestas_consultas WHERE consulta_id = c.id) as cantidad_respuestas
      FROM consultas c
      LEFT JOIN usuarios u ON c.creado_por = u.id
      WHERE c.aula_id = $1
    `;

    const params = [aula_id];

    // Si es estudiante, filtrar por visibilidad
    if (rol_activo === 'estudiante') {
      query += ` AND (c.publica = true OR c.creado_por = $2)`;
      params.push(usuario_id);
    }

    query += ' ORDER BY c.fecha_creacion DESC';

    const resultado = await db.query(query, params);

    // Obtener imágenes para cada consulta
    const consultasConImagenes = await Promise.all(
      resultado.rows.map(async (consulta) => {
        const imagenes = await db.query(
          'SELECT id, nombre_original, nombre_archivo, tipo_mime, tamano_bytes, fecha_subida FROM imagenes_consultas WHERE consulta_id = $1',
          [consulta.id]
        );
        return {
          ...consulta,
          imagenes: imagenes.rows,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: consultasConImagenes,
    });
  } catch (error) {
    console.error('Error al obtener consultas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las consultas',
      error: error.message,
    });
  }
};

/**
 * Obtener detalle de una consulta con todas sus respuestas
 * GET /api/consultas/:consulta_id
 * Accesible por profesores y estudiantes del aula
 * Estudiantes solo pueden ver consultas públicas o sus propias privadas
 */
const obtenerConsultaDetalle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { consulta_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la consulta
    const consulta = await db.query(
      `SELECT
        c.*,
        u.nombre || ' ' || u.apellido as creado_por_nombre,
        u.email as creado_por_email
      FROM consultas c
      LEFT JOIN usuarios u ON c.creado_por = u.id
      WHERE c.id = $1`,
      [consulta_id]
    );

    if (consulta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada',
      });
    }

    const consultaData = consulta.rows[0];

    // Verificar acceso al aula
    let tieneAcceso = false;

    if (rol_activo === 'admin') {
      tieneAcceso = true;
    } else if (rol_activo === 'profesor') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [consultaData.aula_id, usuario_id]
      );
      tieneAcceso = esProfesor.rows.length > 0;
    } else if (rol_activo === 'estudiante') {
      const esEstudiante = await db.query(
        'SELECT * FROM aula_estudiantes WHERE aula_id = $1 AND estudiante_id = $2 AND activo = true',
        [consultaData.aula_id, usuario_id]
      );
      // Estudiantes solo pueden ver consultas públicas o las que ellos crearon
      tieneAcceso = esEstudiante.rows.length > 0 &&
                    (consultaData.publica || consultaData.creado_por === usuario_id);
    }

    if (!tieneAcceso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta consulta',
      });
    }

    // Obtener imágenes de la consulta
    const imagenesConsulta = await db.query(
      'SELECT id, nombre_original, nombre_archivo, tipo_mime, tamano_bytes, fecha_subida FROM imagenes_consultas WHERE consulta_id = $1',
      [consulta_id]
    );

    // Obtener respuestas
    const respuestas = await db.query(
      `SELECT
        r.*,
        u.nombre || ' ' || u.apellido as respondido_por_nombre,
        u.email as respondido_por_email
      FROM respuestas_consultas r
      LEFT JOIN usuarios u ON r.respondido_por = u.id
      WHERE r.consulta_id = $1
      ORDER BY r.fecha_creacion ASC`,
      [consulta_id]
    );

    // Obtener imágenes para cada respuesta
    const respuestasConImagenes = await Promise.all(
      respuestas.rows.map(async (respuesta) => {
        const imagenesRespuesta = await db.query(
          'SELECT id, nombre_original, nombre_archivo, tipo_mime, tamano_bytes, fecha_subida FROM imagenes_consultas WHERE respuesta_id = $1',
          [respuesta.id]
        );
        return {
          ...respuesta,
          imagenes: imagenesRespuesta.rows,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        consulta: {
          ...consultaData,
          imagenes: imagenesConsulta.rows,
        },
        respuestas: respuestasConImagenes,
      },
    });
  } catch (error) {
    console.error('Error al obtener detalle de consulta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle de la consulta',
      error: error.message,
    });
  }
};

/**
 * Crear una respuesta a una consulta
 * POST /api/consultas/:consulta_id/respuestas
 * Body: { respuesta }
 * Si la consulta es privada, solo profesores pueden responder
 * Si es pública, tanto estudiantes como profesores pueden responder
 */
const crearRespuesta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { consulta_id } = req.params;
  const { respuesta } = req.body;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la consulta
    const consulta = await db.query(
      'SELECT * FROM consultas WHERE id = $1',
      [consulta_id]
    );

    if (consulta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada',
      });
    }

    const consultaData = consulta.rows[0];

    // Verificar acceso al aula
    let tieneAcceso = false;
    let puedeResponder = false;

    if (rol_activo === 'admin') {
      tieneAcceso = true;
      puedeResponder = true;
    } else if (rol_activo === 'profesor') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [consultaData.aula_id, usuario_id]
      );
      tieneAcceso = esProfesor.rows.length > 0;
      puedeResponder = tieneAcceso; // Profesores siempre pueden responder si tienen acceso
    } else if (rol_activo === 'estudiante') {
      const esEstudiante = await db.query(
        'SELECT * FROM aula_estudiantes WHERE aula_id = $1 AND estudiante_id = $2 AND activo = true',
        [consultaData.aula_id, usuario_id]
      );
      tieneAcceso = esEstudiante.rows.length > 0;
      // Estudiantes solo pueden responder a consultas públicas
      puedeResponder = tieneAcceso && consultaData.publica;
    }

    if (!tieneAcceso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta aula',
      });
    }

    if (!puedeResponder) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para responder a esta consulta. Las consultas privadas solo pueden ser respondidas por profesores.',
      });
    }

    // Insertar la respuesta
    const resultado = await db.query(
      `INSERT INTO respuestas_consultas
       (consulta_id, respondido_por, respuesta)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [consulta_id, usuario_id, respuesta]
    );

    res.status(201).json({
      success: true,
      message: 'Respuesta creada exitosamente',
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al crear respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la respuesta',
      error: error.message,
    });
  }
};

/**
 * Marcar una consulta como resuelta (toggle)
 * PUT /api/consultas/:consulta_id/resuelta
 * Solo el creador de la consulta puede marcarla como resuelta
 */
const marcarComoResuelta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { consulta_id } = req.params;
  const usuario_id = req.usuario.id;

  try {
    // Obtener la consulta
    const consulta = await db.query(
      'SELECT * FROM consultas WHERE id = $1',
      [consulta_id]
    );

    if (consulta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada',
      });
    }

    const consultaData = consulta.rows[0];

    // Verificar que el usuario es el creador de la consulta
    if (consultaData.creado_por !== usuario_id) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador de la consulta puede marcarla como resuelta',
      });
    }

    // Toggle resuelta
    const nuevoValor = !consultaData.resuelta;
    const resultado = await db.query(
      'UPDATE consultas SET resuelta = $1 WHERE id = $2 RETURNING *',
      [nuevoValor, consulta_id]
    );

    res.status(200).json({
      success: true,
      message: `Consulta marcada como ${nuevoValor ? 'resuelta' : 'no resuelta'}`,
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al marcar consulta como resuelta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la consulta',
      error: error.message,
    });
  }
};

/**
 * Eliminar una consulta
 * DELETE /api/consultas/:consulta_id
 * Solo el creador o profesores del aula pueden eliminar
 */
const eliminarConsulta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { consulta_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la consulta
    const consulta = await db.query(
      'SELECT * FROM consultas WHERE id = $1',
      [consulta_id]
    );

    if (consulta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada',
      });
    }

    const consultaData = consulta.rows[0];

    // Verificar permisos
    let puedeEliminar = false;

    if (rol_activo === 'admin') {
      puedeEliminar = true;
    } else if (consultaData.creado_por === usuario_id) {
      // El creador siempre puede eliminar su consulta
      puedeEliminar = true;
    } else if (rol_activo === 'profesor') {
      // Profesores del aula pueden eliminar cualquier consulta
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [consultaData.aula_id, usuario_id]
      );
      puedeEliminar = esProfesor.rows.length > 0;
    }

    if (!puedeEliminar) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta consulta',
      });
    }

    // Eliminar la consulta (las respuestas se eliminan en cascada)
    await db.query('DELETE FROM consultas WHERE id = $1', [consulta_id]);

    res.status(200).json({
      success: true,
      message: 'Consulta eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar consulta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la consulta',
      error: error.message,
    });
  }
};

/**
 * Eliminar una respuesta
 * DELETE /api/consultas/respuestas/:respuesta_id
 * Solo el autor de la respuesta o profesores del aula pueden eliminar
 */
const eliminarRespuesta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { respuesta_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener la respuesta y la consulta asociada
    const respuesta = await db.query(
      `SELECT r.*, c.aula_id
       FROM respuestas_consultas r
       JOIN consultas c ON r.consulta_id = c.id
       WHERE r.id = $1`,
      [respuesta_id]
    );

    if (respuesta.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Respuesta no encontrada',
      });
    }

    const respuestaData = respuesta.rows[0];

    // Verificar permisos
    let puedeEliminar = false;

    if (rol_activo === 'admin') {
      puedeEliminar = true;
    } else if (respuestaData.respondido_por === usuario_id) {
      // El autor siempre puede eliminar su respuesta
      puedeEliminar = true;
    } else if (rol_activo === 'profesor') {
      // Profesores del aula pueden eliminar cualquier respuesta
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [respuestaData.aula_id, usuario_id]
      );
      puedeEliminar = esProfesor.rows.length > 0;
    }

    if (!puedeEliminar) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta respuesta',
      });
    }

    // Eliminar la respuesta
    await db.query('DELETE FROM respuestas_consultas WHERE id = $1', [respuesta_id]);

    res.status(200).json({
      success: true,
      message: 'Respuesta eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la respuesta',
      error: error.message,
    });
  }
};

/**
 * Subir imagen a una consulta
 * POST /api/consultas/:consulta_id/imagenes
 * Body: FormData con imagen
 * Solo el creador de la consulta puede subir imágenes
 */
const subirImagenConsulta = async (req, res) => {
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

  const { consulta_id } = req.params;
  const usuario_id = req.usuario.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se proporcionó ninguna imagen',
    });
  }

  try {
    // Obtener la consulta
    const consulta = await db.query('SELECT * FROM consultas WHERE id = $1', [consulta_id]);

    if (consulta.rows.length === 0) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada',
      });
    }

    const consultaData = consulta.rows[0];

    // Verificar que el usuario es el creador de la consulta
    if (consultaData.creado_por !== usuario_id) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(403).json({
        success: false,
        message: 'Solo el creador de la consulta puede subir imágenes',
      });
    }

    // Insertar registro en la base de datos
    const resultado = await db.query(
      `INSERT INTO imagenes_consultas
       (consulta_id, nombre_original, nombre_archivo, tipo_mime, tamano_bytes, subido_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        consulta_id,
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
    console.error('Error al subir imagen:', error);
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
 * Subir imagen a una respuesta
 * POST /api/consultas/respuestas/:respuesta_id/imagenes
 * Body: FormData con imagen
 * Solo el autor de la respuesta puede subir imágenes
 */
const subirImagenRespuesta = async (req, res) => {
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

  const { respuesta_id } = req.params;
  const usuario_id = req.usuario.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se proporcionó ninguna imagen',
    });
  }

  try {
    // Obtener la respuesta
    const respuesta = await db.query(
      'SELECT * FROM respuestas_consultas WHERE id = $1',
      [respuesta_id]
    );

    if (respuesta.rows.length === 0) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({
        success: false,
        message: 'Respuesta no encontrada',
      });
    }

    const respuestaData = respuesta.rows[0];

    // Verificar que el usuario es el autor de la respuesta
    if (respuestaData.respondido_por !== usuario_id) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(403).json({
        success: false,
        message: 'Solo el autor de la respuesta puede subir imágenes',
      });
    }

    // Insertar registro en la base de datos
    const resultado = await db.query(
      `INSERT INTO imagenes_consultas
       (respuesta_id, nombre_original, nombre_archivo, tipo_mime, tamano_bytes, subido_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        respuesta_id,
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
    console.error('Error al subir imagen:', error);
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
 * Eliminar una imagen
 * DELETE /api/consultas/imagenes/:imagen_id
 * Solo el que subió la imagen puede eliminarla
 */
const eliminarImagen = async (req, res) => {
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
      'SELECT * FROM imagenes_consultas WHERE id = $1',
      [imagen_id]
    );

    if (imagen.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada',
      });
    }

    const imagenData = imagen.rows[0];

    // Verificar permisos
    let puedeEliminar = false;

    if (rol_activo === 'admin') {
      puedeEliminar = true;
    } else if (imagenData.subido_por === usuario_id) {
      // El que subió la imagen puede eliminarla
      puedeEliminar = true;
    } else if (rol_activo === 'profesor') {
      // Profesores del aula pueden eliminar imágenes
      // Primero necesitamos obtener el aula_id
      let aula_id;
      if (imagenData.consulta_id) {
        const consulta = await db.query(
          'SELECT aula_id FROM consultas WHERE id = $1',
          [imagenData.consulta_id]
        );
        aula_id = consulta.rows[0]?.aula_id;
      } else if (imagenData.respuesta_id) {
        const respuesta = await db.query(
          `SELECT c.aula_id
           FROM respuestas_consultas r
           JOIN consultas c ON r.consulta_id = c.id
           WHERE r.id = $1`,
          [imagenData.respuesta_id]
        );
        aula_id = respuesta.rows[0]?.aula_id;
      }

      if (aula_id) {
        const esProfesor = await db.query(
          'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
          [aula_id, usuario_id]
        );
        puedeEliminar = esProfesor.rows.length > 0;
      }
    }

    if (!puedeEliminar) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta imagen',
      });
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../uploads/consultas', imagenData.nombre_archivo);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
      // Continuar con eliminación en BD aunque falle eliminación física
    }

    // Eliminar registro de la base de datos
    await db.query('DELETE FROM imagenes_consultas WHERE id = $1', [imagen_id]);

    res.status(200).json({
      success: true,
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la imagen',
      error: error.message,
    });
  }
};

module.exports = {
  subirImagenMiddleware,
  crearConsulta,
  obtenerConsultasAula,
  obtenerConsultaDetalle,
  crearRespuesta,
  marcarComoResuelta,
  eliminarConsulta,
  eliminarRespuesta,
  subirImagenConsulta,
  subirImagenRespuesta,
  eliminarImagen,
};
