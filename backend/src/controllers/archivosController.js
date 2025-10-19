const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Configuración de multer para almacenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único con UUID + extensión original
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// Filtro para validar tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  // Lista de MIME types permitidos (muy amplia para soportar diversos formatos educativos)
  const allowedMimeTypes = [
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Hojas de cálculo
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    // Presentaciones
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Imágenes
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Texto
    'text/plain',
    'text/markdown',
    // Comprimidos
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/webm',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    // Otros formatos educativos
    'application/json',
    'application/xml',
    'text/xml',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 104857600, // 100 MB en bytes
  },
});

/**
 * Middleware de multer para subir un archivo
 */
const subirArchivoMiddleware = upload.single('archivo');

/**
 * Subir un archivo al aula
 * POST /api/archivos/subir
 * Body: FormData con archivo, aula_id, hoja_id, descripcion (opcional)
 * Solo profesores asignados al aula
 */
const subirArchivo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Si hay archivo subido pero validación falla, eliminar el archivo
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { aula_id, hoja_id, descripcion } = req.body;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se proporcionó ningún archivo',
    });
  }

  try {
    // Verificar que el aula existe
    const aulaExiste = await db.query('SELECT id FROM aulas WHERE id = $1', [aula_id]);
    if (aulaExiste.rows.length === 0) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({
        success: false,
        message: 'El aula no existe',
      });
    }

    // Verificar que la hoja existe y pertenece al aula
    const hojaExiste = await db.query(
      'SELECT id FROM hojas_aula WHERE id = $1 AND aula_id = $2',
      [hoja_id, aula_id]
    );
    if (hojaExiste.rows.length === 0) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({
        success: false,
        message: 'La hoja no existe o no pertenece al aula',
      });
    }

    // Verificar que el usuario es profesor del aula (o admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [aula_id, usuario_id]
      );
      if (esProfesor.rows.length === 0) {
        await fs.unlink(req.file.path).catch(console.error);
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para subir archivos a esta aula',
        });
      }
    }

    // Insertar registro en la base de datos
    const resultado = await db.query(
      `INSERT INTO archivos_aula
       (aula_id, hoja_id, nombre_original, nombre_archivo, tipo_mime, tamano_bytes, descripcion, subido_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        aula_id,
        hoja_id,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        descripcion || null,
        usuario_id,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Archivo subido exitosamente',
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    // Intentar eliminar el archivo si hubo error en BD
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({
      success: false,
      message: 'Error al subir el archivo',
      error: error.message,
    });
  }
};

/**
 * Obtener archivos de una hoja de aula
 * GET /api/archivos/aula/:aula_id?hoja_id=xxx
 * Accesible por profesores asignados y estudiantes matriculados
 */
const obtenerArchivosAula = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { aula_id } = req.params;
  const { hoja_id } = req.query;
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

    // Construir query
    let query = `
      SELECT
        a.id,
        a.aula_id,
        a.hoja_id,
        a.nombre_original,
        a.nombre_archivo,
        a.tipo_mime,
        a.tamano_bytes,
        a.descripcion,
        a.visible,
        a.fecha_subida,
        u.nombre || ' ' || u.apellido as subido_por_nombre
      FROM archivos_aula a
      LEFT JOIN usuarios u ON a.subido_por = u.id
      WHERE a.aula_id = $1
    `;

    const params = [aula_id];

    // Filtrar por hoja si se proporciona
    if (hoja_id) {
      query += ' AND a.hoja_id = $2';
      params.push(hoja_id);
    }

    // Si es estudiante, solo ver archivos visibles
    if (rol_activo === 'estudiante') {
      query += ` AND a.visible = true`;
    }

    query += ' ORDER BY a.fecha_subida DESC';

    const resultado = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: resultado.rows,
    });
  } catch (error) {
    console.error('Error al obtener archivos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los archivos',
      error: error.message,
    });
  }
};

/**
 * Descargar un archivo
 * GET /api/archivos/descargar/:archivo_id
 * Accesible por profesores asignados y estudiantes matriculados (si visible)
 */
const descargarArchivo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { archivo_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener información del archivo
    const archivo = await db.query(
      'SELECT * FROM archivos_aula WHERE id = $1',
      [archivo_id]
    );

    if (archivo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado',
      });
    }

    const archivoData = archivo.rows[0];

    // Verificar acceso
    let tieneAcceso = false;

    if (rol_activo === 'admin') {
      tieneAcceso = true;
    } else if (rol_activo === 'profesor') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [archivoData.aula_id, usuario_id]
      );
      tieneAcceso = esProfesor.rows.length > 0;
    } else if (rol_activo === 'estudiante') {
      const esEstudiante = await db.query(
        'SELECT * FROM aula_estudiantes WHERE aula_id = $1 AND estudiante_id = $2 AND activo = true',
        [archivoData.aula_id, usuario_id]
      );
      // Estudiantes solo pueden descargar archivos visibles
      tieneAcceso = esEstudiante.rows.length > 0 && archivoData.visible;
    }

    if (!tieneAcceso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para descargar este archivo',
      });
    }

    // Ruta del archivo
    const filePath = path.join(__dirname, '../../uploads', archivoData.nombre_archivo);

    // Verificar que el archivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el servidor',
      });
    }

    // Enviar archivo
    res.download(filePath, archivoData.nombre_original, (err) => {
      if (err) {
        console.error('Error al descargar archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error al descargar el archivo',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar el archivo',
      error: error.message,
    });
  }
};

/**
 * Eliminar un archivo
 * DELETE /api/archivos/:archivo_id
 * Solo profesores asignados al aula
 */
const eliminarArchivo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { archivo_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener información del archivo
    const archivo = await db.query(
      'SELECT * FROM archivos_aula WHERE id = $1',
      [archivo_id]
    );

    if (archivo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado',
      });
    }

    const archivoData = archivo.rows[0];

    // Verificar que el usuario es profesor del aula (o admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [archivoData.aula_id, usuario_id]
      );
      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar este archivo',
        });
      }
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../uploads', archivoData.nombre_archivo);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
      // Continuar con eliminación en BD aunque falle eliminación física
    }

    // Eliminar registro de la base de datos
    await db.query('DELETE FROM archivos_aula WHERE id = $1', [archivo_id]);

    res.status(200).json({
      success: true,
      message: 'Archivo eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el archivo',
      error: error.message,
    });
  }
};

/**
 * Cambiar visibilidad de un archivo (toggle visible/oculto)
 * PUT /api/archivos/:archivo_id/visible
 * Solo profesores asignados al aula
 */
const cambiarVisibilidadArchivo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { archivo_id } = req.params;
  const usuario_id = req.usuario.id;
  const rol_activo = req.headers['x-rol-activo'] || req.usuario.roles[0];

  try {
    // Obtener archivo actual
    const archivoActual = await db.query(
      'SELECT aula_id, visible FROM archivos_aula WHERE id = $1',
      [archivo_id]
    );

    if (archivoActual.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado',
      });
    }

    const aula_id = archivoActual.rows[0].aula_id;

    // Verificar que el usuario es profesor del aula (o admin)
    if (rol_activo !== 'admin') {
      const esProfesor = await db.query(
        'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2 AND activo = true',
        [aula_id, usuario_id]
      );
      if (esProfesor.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar la visibilidad de este archivo',
        });
      }
    }

    // Cambiar visibilidad (toggle)
    const nuevoValor = !archivoActual.rows[0].visible;
    const resultado = await db.query(
      'UPDATE archivos_aula SET visible = $1 WHERE id = $2 RETURNING *',
      [nuevoValor, archivo_id]
    );

    res.status(200).json({
      success: true,
      message: `Archivo ${nuevoValor ? 'visible' : 'oculto'} exitosamente`,
      data: resultado.rows[0],
    });
  } catch (error) {
    console.error('Error al cambiar visibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar la visibilidad del archivo',
      error: error.message,
    });
  }
};

module.exports = {
  subirArchivoMiddleware,
  subirArchivo,
  obtenerArchivosAula,
  descargarArchivo,
  eliminarArchivo,
  cambiarVisibilidadArchivo,
};
