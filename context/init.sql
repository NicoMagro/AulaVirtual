-- ============================================
-- Base de Datos: AulaVirtual
-- Sistema de Registro y Login (Versión Básica)
-- ============================================

-- Crear la base de datos
CREATE DATABASE AulaVirtual;

-- Conectar a la base de datos
\c AulaVirtual;

-- ============================================
-- Extensiones
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tabla: usuarios
-- ============================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================
-- Tabla: roles
-- ============================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabla: usuario_roles (Relación muchos a muchos)
-- ============================================
CREATE TABLE usuario_roles (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    asignado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, rol_id)
);

-- ============================================
-- Índices para optimización
-- ============================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================
-- Insertar roles por defecto
-- ============================================
INSERT INTO roles (nombre, descripcion) VALUES
    ('admin', 'Administrador del sistema con acceso completo'),
    ('profesor', 'Profesor con permisos para crear y gestionar cursos'),
    ('estudiante', 'Estudiante con acceso a cursos asignados');

-- ============================================
-- Comentarios en las tablas
-- ============================================
COMMENT ON TABLE usuarios IS 'Tabla principal de usuarios del sistema';
COMMENT ON TABLE roles IS 'Roles disponibles en el sistema';
COMMENT ON TABLE usuario_roles IS 'Relación entre usuarios y roles';

-- ============================================
-- Tabla: aulas
-- ============================================
CREATE TABLE aulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    capacidad_maxima INTEGER DEFAULT 30,
    clave_matriculacion VARCHAR(255), -- NULL = aula pública, con valor = requiere clave
    activo BOOLEAN DEFAULT true,
    creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT capacidad_positiva CHECK (capacidad_maxima > 0)
);

-- ============================================
-- Tabla: aula_profesores (Relación muchos a muchos)
-- ============================================
CREATE TABLE aula_profesores (
    aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE,
    profesor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    asignado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    asignado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    PRIMARY KEY (aula_id, profesor_id)
);

-- ============================================
-- Tabla: aula_estudiantes (Relación muchos a muchos)
-- ============================================
CREATE TABLE aula_estudiantes (
    aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE,
    estudiante_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_matriculacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    PRIMARY KEY (aula_id, estudiante_id)
);

-- ============================================
-- Índices adicionales para aulas
-- ============================================
CREATE INDEX idx_aulas_activo ON aulas(activo);
CREATE INDEX idx_aulas_creado_por ON aulas(creado_por);
CREATE INDEX idx_aula_profesores_aula ON aula_profesores(aula_id);
CREATE INDEX idx_aula_profesores_profesor ON aula_profesores(profesor_id);
CREATE INDEX idx_aula_profesores_activo ON aula_profesores(activo);
CREATE INDEX idx_aula_estudiantes_aula ON aula_estudiantes(aula_id);
CREATE INDEX idx_aula_estudiantes_estudiante ON aula_estudiantes(estudiante_id);
CREATE INDEX idx_aula_estudiantes_activo ON aula_estudiantes(activo);

-- ============================================
-- Función para actualizar fecha_actualizacion automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger para actualizar fecha_actualizacion en aulas
-- ============================================
CREATE TRIGGER trigger_actualizar_aulas
    BEFORE UPDATE ON aulas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- ============================================
-- Comentarios adicionales
-- ============================================
COMMENT ON TABLE aulas IS 'Tabla de aulas/clases del sistema';
COMMENT ON TABLE aula_profesores IS 'Relación entre aulas y profesores asignados';
COMMENT ON TABLE aula_estudiantes IS 'Relación entre aulas y estudiantes matriculados';
COMMENT ON COLUMN aulas.clave_matriculacion IS 'Clave para matricularse (NULL = aula pública)';

-- ============================================
-- Tabla: hojas_aula
-- Almacena las hojas/pestañas de cada aula (similar a hojas de Excel)
-- ============================================
CREATE TABLE hojas_aula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT nombre_no_vacio CHECK (LENGTH(TRIM(nombre)) > 0),
    CONSTRAINT orden_positivo_hoja CHECK (orden >= 0),
    CONSTRAINT nombre_unico_por_aula UNIQUE (aula_id, nombre)
);

-- ============================================
-- Índices para hojas_aula
-- ============================================
CREATE INDEX idx_hojas_aula_aula ON hojas_aula(aula_id);
CREATE INDEX idx_hojas_aula_orden ON hojas_aula(aula_id, orden);
CREATE INDEX idx_hojas_aula_visible ON hojas_aula(visible);
CREATE INDEX idx_hojas_aula_activo ON hojas_aula(activo);

-- ============================================
-- Trigger para actualizar fecha_actualizacion en hojas_aula
-- ============================================
CREATE TRIGGER trigger_actualizar_hojas_aula
    BEFORE UPDATE ON hojas_aula
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- ============================================
-- Comentarios para hojas_aula
-- ============================================
COMMENT ON TABLE hojas_aula IS 'Hojas/pestañas de cada aula (similar a hojas de Excel)';
COMMENT ON COLUMN hojas_aula.nombre IS 'Nombre de la hoja (ej: General, Unidad 1, etc.)';
COMMENT ON COLUMN hojas_aula.orden IS 'Orden de visualización de la pestaña (menor = primero)';
COMMENT ON COLUMN hojas_aula.visible IS 'Indica si la hoja es visible para estudiantes (false = solo profesores)';

-- ============================================
-- Tabla: contenido_aulas
-- Almacena los bloques de contenido de cada aula
-- ============================================
CREATE TABLE contenido_aulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE NOT NULL,
    hoja_id UUID REFERENCES hojas_aula(id) ON DELETE CASCADE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    contenido TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tipo_valido CHECK (tipo IN ('titulo', 'subtitulo', 'parrafo', 'lista', 'enlace', 'separador')),
    CONSTRAINT orden_positivo CHECK (orden >= 0)
);

-- ============================================
-- Índices para contenido_aulas
-- ============================================
CREATE INDEX idx_contenido_aulas_aula ON contenido_aulas(aula_id);
CREATE INDEX idx_contenido_aulas_hoja ON contenido_aulas(hoja_id);
CREATE INDEX idx_contenido_aulas_orden ON contenido_aulas(aula_id, hoja_id, orden);
CREATE INDEX idx_contenido_aulas_visible ON contenido_aulas(visible);
CREATE INDEX idx_contenido_aulas_creado_por ON contenido_aulas(creado_por);

-- ============================================
-- Trigger para actualizar fecha_actualizacion en contenido_aulas
-- ============================================
CREATE TRIGGER trigger_actualizar_contenido_aulas
    BEFORE UPDATE ON contenido_aulas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- ============================================
-- Comentarios para contenido_aulas
-- ============================================
COMMENT ON TABLE contenido_aulas IS 'Bloques de contenido de las aulas';
COMMENT ON COLUMN contenido_aulas.tipo IS 'Tipo de bloque: titulo, subtitulo, parrafo, lista, enlace, separador';
COMMENT ON COLUMN contenido_aulas.orden IS 'Orden de visualización del bloque (menor = primero)';
COMMENT ON COLUMN contenido_aulas.contenido IS 'Contenido del bloque en formato texto o JSON según el tipo';
COMMENT ON COLUMN contenido_aulas.visible IS 'Indica si el bloque es visible para estudiantes (false = solo profesores)';

-- ============================================
-- Tabla: archivos_aula
-- Almacena archivos subidos por profesores (PDF, presentaciones, etc.)
-- ============================================
CREATE TABLE archivos_aula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE NOT NULL,
    hoja_id UUID REFERENCES hojas_aula(id) ON DELETE CASCADE NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL UNIQUE,
    tipo_mime VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    descripcion TEXT,
    visible BOOLEAN DEFAULT true,
    subido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tamano_positivo CHECK (tamano_bytes > 0),
    CONSTRAINT tamano_maximo CHECK (tamano_bytes <= 104857600)
);

-- ============================================
-- Índices para archivos_aula
-- ============================================
CREATE INDEX idx_archivos_aula_aula ON archivos_aula(aula_id);
CREATE INDEX idx_archivos_aula_hoja ON archivos_aula(hoja_id);
CREATE INDEX idx_archivos_aula_visible ON archivos_aula(visible);
CREATE INDEX idx_archivos_aula_subido_por ON archivos_aula(subido_por);

-- ============================================
-- Trigger para actualizar fecha_actualizacion en archivos_aula
-- ============================================
CREATE TRIGGER trigger_actualizar_archivos_aula
    BEFORE UPDATE ON archivos_aula
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- ============================================
-- Comentarios para archivos_aula
-- ============================================
COMMENT ON TABLE archivos_aula IS 'Archivos subidos por profesores (PDF, presentaciones, documentos, etc.)';
COMMENT ON COLUMN archivos_aula.nombre_original IS 'Nombre original del archivo al subirlo';
COMMENT ON COLUMN archivos_aula.nombre_archivo IS 'Nombre único del archivo en el servidor (UUID)';
COMMENT ON COLUMN archivos_aula.tipo_mime IS 'Tipo MIME del archivo (application/pdf, etc.)';
COMMENT ON COLUMN archivos_aula.tamano_bytes IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN archivos_aula.visible IS 'Indica si el archivo es visible para estudiantes (false = solo profesores)';

-- ============================================
-- Tabla: consultas
-- Almacena consultas/preguntas de estudiantes sobre el contenido del aula
-- ============================================
CREATE TABLE consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE NOT NULL,
    hoja_id UUID REFERENCES hojas_aula(id) ON DELETE SET NULL,
    bloque_id UUID REFERENCES contenido_aulas(id) ON DELETE SET NULL,
    archivo_id UUID REFERENCES archivos_aula(id) ON DELETE SET NULL,
    creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    pregunta TEXT NOT NULL,
    publica BOOLEAN DEFAULT true,
    resuelta BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT titulo_no_vacio CHECK (LENGTH(TRIM(titulo)) > 0),
    CONSTRAINT pregunta_no_vacia CHECK (LENGTH(TRIM(pregunta)) > 0)
);

-- ============================================
-- Tabla: respuestas_consultas
-- Almacena las respuestas a las consultas
-- ============================================
CREATE TABLE respuestas_consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consulta_id UUID REFERENCES consultas(id) ON DELETE CASCADE NOT NULL,
    respondido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL NOT NULL,
    respuesta TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT respuesta_no_vacia CHECK (LENGTH(TRIM(respuesta)) > 0)
);

-- ============================================
-- Índices para consultas
-- ============================================
CREATE INDEX idx_consultas_aula ON consultas(aula_id);
CREATE INDEX idx_consultas_hoja ON consultas(hoja_id);
CREATE INDEX idx_consultas_bloque ON consultas(bloque_id);
CREATE INDEX idx_consultas_archivo ON consultas(archivo_id);
CREATE INDEX idx_consultas_creado_por ON consultas(creado_por);
CREATE INDEX idx_consultas_publica ON consultas(publica);
CREATE INDEX idx_consultas_resuelta ON consultas(resuelta);
CREATE INDEX idx_consultas_fecha ON consultas(fecha_creacion DESC);

-- ============================================
-- Índices para respuestas_consultas
-- ============================================
CREATE INDEX idx_respuestas_consulta ON respuestas_consultas(consulta_id);
CREATE INDEX idx_respuestas_respondido_por ON respuestas_consultas(respondido_por);
CREATE INDEX idx_respuestas_fecha ON respuestas_consultas(fecha_creacion ASC);

-- ============================================
-- Triggers para actualizar fecha_actualizacion
-- ============================================
CREATE TRIGGER trigger_actualizar_consultas
    BEFORE UPDATE ON consultas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trigger_actualizar_respuestas_consultas
    BEFORE UPDATE ON respuestas_consultas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- ============================================
-- Comentarios para consultas
-- ============================================
COMMENT ON TABLE consultas IS 'Consultas/preguntas de estudiantes sobre el contenido del aula';
COMMENT ON COLUMN consultas.titulo IS 'Título breve de la consulta';
COMMENT ON COLUMN consultas.pregunta IS 'Texto completo de la pregunta';
COMMENT ON COLUMN consultas.publica IS 'true = todos ven, false = solo profesores y creador';
COMMENT ON COLUMN consultas.resuelta IS 'Indica si la consulta fue marcada como resuelta por el creador';
COMMENT ON COLUMN consultas.hoja_id IS 'Hoja referenciada (opcional)';
COMMENT ON COLUMN consultas.bloque_id IS 'Bloque de contenido referenciado (opcional)';
COMMENT ON COLUMN consultas.archivo_id IS 'Archivo referenciado (opcional)';

-- ============================================
-- Comentarios para respuestas_consultas
-- ============================================
COMMENT ON TABLE respuestas_consultas IS 'Respuestas a las consultas de estudiantes';
COMMENT ON COLUMN respuestas_consultas.respuesta IS 'Texto de la respuesta';

-- ============================================
-- Tabla: imagenes_consultas
-- Almacena imágenes adjuntas a consultas y respuestas
-- ============================================
CREATE TABLE imagenes_consultas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consulta_id UUID REFERENCES consultas(id) ON DELETE CASCADE,
    respuesta_id UUID REFERENCES respuestas_consultas(id) ON DELETE CASCADE,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL UNIQUE,
    tipo_mime VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    subido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tamano_positivo_imagen CHECK (tamano_bytes > 0),
    CONSTRAINT tamano_maximo_imagen CHECK (tamano_bytes <= 10485760), -- 10MB máximo
    CONSTRAINT tipo_mime_imagen CHECK (tipo_mime IN ('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp')),
    CONSTRAINT una_referencia CHECK (
        (consulta_id IS NOT NULL AND respuesta_id IS NULL) OR
        (consulta_id IS NULL AND respuesta_id IS NOT NULL)
    )
);

-- ============================================
-- Índices para imagenes_consultas
-- ============================================
CREATE INDEX idx_imagenes_consultas_consulta ON imagenes_consultas(consulta_id);
CREATE INDEX idx_imagenes_consultas_respuesta ON imagenes_consultas(respuesta_id);
CREATE INDEX idx_imagenes_consultas_subido_por ON imagenes_consultas(subido_por);

-- ============================================
-- Comentarios para imagenes_consultas
-- ============================================
COMMENT ON TABLE imagenes_consultas IS 'Imágenes adjuntas a consultas y respuestas';
COMMENT ON COLUMN imagenes_consultas.consulta_id IS 'ID de consulta (NULL si es imagen de respuesta)';
COMMENT ON COLUMN imagenes_consultas.respuesta_id IS 'ID de respuesta (NULL si es imagen de consulta)';
COMMENT ON COLUMN imagenes_consultas.nombre_original IS 'Nombre original de la imagen al subirla';
COMMENT ON COLUMN imagenes_consultas.nombre_archivo IS 'Nombre único de la imagen en el servidor (UUID)';
COMMENT ON COLUMN imagenes_consultas.tipo_mime IS 'Tipo MIME de la imagen (image/jpeg, image/png, etc.)';
COMMENT ON COLUMN imagenes_consultas.tamano_bytes IS 'Tamaño de la imagen en bytes (máximo 10MB)';

-- ============================================
-- SISTEMA DE EVALUACIONES
-- ============================================

-- ============================================
-- Tabla: evaluaciones
-- Almacena las evaluaciones/exámenes de un aula
-- ============================================
CREATE TABLE evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aula_id UUID REFERENCES aulas(id) ON DELETE CASCADE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador',
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    duracion_maxima_minutos INTEGER,
    intentos_permitidos INTEGER DEFAULT 1,
    cantidad_preguntas_mostrar INTEGER NOT NULL,
    orden_aleatorio BOOLEAN DEFAULT false,
    mostrar_respuestas_correctas BOOLEAN DEFAULT true,
    nota_minima_aprobacion NUMERIC(4,2) DEFAULT 6.00,
    creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT estado_valido CHECK (estado IN ('borrador', 'publicado', 'cerrado')),
    CONSTRAINT intentos_positivos CHECK (intentos_permitidos > 0),
    CONSTRAINT cantidad_positiva CHECK (cantidad_preguntas_mostrar > 0),
    CONSTRAINT duracion_positiva CHECK (duracion_maxima_minutos IS NULL OR duracion_maxima_minutos > 0),
    CONSTRAINT nota_valida CHECK (nota_minima_aprobacion >= 0 AND nota_minima_aprobacion <= 10)
);

-- ============================================
-- Tabla: preguntas_banco
-- Banco de preguntas de una evaluación
-- ============================================
CREATE TABLE preguntas_banco (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID REFERENCES evaluaciones(id) ON DELETE CASCADE NOT NULL,
    tipo_pregunta VARCHAR(50) NOT NULL,
    enunciado TEXT NOT NULL,
    puntaje NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    orden INTEGER NOT NULL DEFAULT 0,
    creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tipo_pregunta_valido CHECK (tipo_pregunta IN ('multiple_choice', 'verdadero_falso', 'verdadero_falso_justificacion', 'desarrollo')),
    CONSTRAINT puntaje_positivo CHECK (puntaje > 0),
    CONSTRAINT orden_positivo_pregunta CHECK (orden >= 0)
);

-- ============================================
-- Tabla: opciones_pregunta
-- Opciones para preguntas de múltiple choice
-- ============================================
CREATE TABLE opciones_pregunta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregunta_id UUID REFERENCES preguntas_banco(id) ON DELETE CASCADE NOT NULL,
    texto_opcion TEXT NOT NULL,
    es_correcta BOOLEAN DEFAULT false,
    orden INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT orden_positivo_opcion CHECK (orden >= 0)
);

-- ============================================
-- Tabla: respuestas_correctas_vf
-- Respuestas correctas para preguntas de verdadero/falso
-- ============================================
CREATE TABLE respuestas_correctas_vf (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregunta_id UUID REFERENCES preguntas_banco(id) ON DELETE CASCADE NOT NULL UNIQUE,
    respuesta_correcta BOOLEAN NOT NULL
);

-- ============================================
-- Tabla: intentos_evaluacion
-- Intentos de los estudiantes en una evaluación
-- ============================================
CREATE TABLE intentos_evaluacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id UUID REFERENCES evaluaciones(id) ON DELETE CASCADE NOT NULL,
    estudiante_id UUID REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    numero_intento INTEGER NOT NULL,
    puntaje_total NUMERIC(6,2) NOT NULL,
    puntaje_obtenido NUMERIC(6,2) DEFAULT 0,
    nota_obtenida NUMERIC(4,2),
    estado VARCHAR(20) NOT NULL DEFAULT 'en_progreso',
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    fecha_calificacion TIMESTAMP WITH TIME ZONE,
    tiempo_usado_minutos INTEGER,
    CONSTRAINT estado_intento_valido CHECK (estado IN ('en_progreso', 'entregado', 'calificado')),
    CONSTRAINT numero_intento_positivo CHECK (numero_intento > 0),
    CONSTRAINT puntaje_total_positivo CHECK (puntaje_total >= 0),
    CONSTRAINT puntaje_obtenido_valido CHECK (puntaje_obtenido >= 0 AND puntaje_obtenido <= puntaje_total),
    CONSTRAINT nota_obtenida_valida CHECK (nota_obtenida IS NULL OR (nota_obtenida >= 0 AND nota_obtenida <= 10)),
    CONSTRAINT tiempo_usado_positivo CHECK (tiempo_usado_minutos IS NULL OR tiempo_usado_minutos > 0),
    CONSTRAINT intento_unico UNIQUE (evaluacion_id, estudiante_id, numero_intento)
);

-- ============================================
-- Tabla: preguntas_intento
-- Preguntas asignadas a un intento específico
-- ============================================
CREATE TABLE preguntas_intento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intento_id UUID REFERENCES intentos_evaluacion(id) ON DELETE CASCADE NOT NULL,
    pregunta_id UUID REFERENCES preguntas_banco(id) ON DELETE CASCADE NOT NULL,
    orden_mostrado INTEGER NOT NULL,
    CONSTRAINT orden_mostrado_positivo CHECK (orden_mostrado >= 0),
    CONSTRAINT pregunta_intento_unico UNIQUE (intento_id, pregunta_id)
);

-- ============================================
-- Tabla: respuestas_estudiante
-- Respuestas del estudiante en un intento
-- ============================================
CREATE TABLE respuestas_estudiante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intento_id UUID REFERENCES intentos_evaluacion(id) ON DELETE CASCADE NOT NULL,
    pregunta_id UUID REFERENCES preguntas_banco(id) ON DELETE CASCADE NOT NULL,
    respuesta_texto TEXT,
    opcion_seleccionada_id UUID REFERENCES opciones_pregunta(id) ON DELETE SET NULL,
    respuesta_booleana BOOLEAN,
    justificacion TEXT,
    puntaje_obtenido NUMERIC(5,2) DEFAULT 0,
    es_correcta BOOLEAN,
    retroalimentacion_profesor TEXT,
    calificado_por UUID REFERENCES usuarios(id),
    fecha_calificacion TIMESTAMP WITH TIME ZONE,
    fecha_respuesta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT respuesta_unica UNIQUE (intento_id, pregunta_id)
);

-- ============================================
-- Tabla: imagenes_respuestas
-- Imágenes adjuntas a respuestas de estudiantes (para preguntas de desarrollo)
-- ============================================
CREATE TABLE imagenes_respuestas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    respuesta_id UUID REFERENCES respuestas_estudiante(id) ON DELETE CASCADE NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL UNIQUE,
    tipo_mime VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tamano_positivo_imagen_respuesta CHECK (tamano_bytes > 0),
    CONSTRAINT tamano_maximo_imagen_respuesta CHECK (tamano_bytes <= 10485760),
    CONSTRAINT tipo_mime_imagen_respuesta CHECK (tipo_mime IN ('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'))
);

-- ============================================
-- Índices para evaluaciones
-- ============================================
CREATE INDEX idx_evaluaciones_aula ON evaluaciones(aula_id);
CREATE INDEX idx_evaluaciones_estado ON evaluaciones(estado);
CREATE INDEX idx_evaluaciones_creado_por ON evaluaciones(creado_por);
CREATE INDEX idx_evaluaciones_fecha_inicio ON evaluaciones(fecha_inicio);
CREATE INDEX idx_evaluaciones_fecha_fin ON evaluaciones(fecha_fin);

-- ============================================
-- Índices para preguntas_banco
-- ============================================
CREATE INDEX idx_preguntas_banco_evaluacion ON preguntas_banco(evaluacion_id);
CREATE INDEX idx_preguntas_banco_tipo ON preguntas_banco(tipo_pregunta);
CREATE INDEX idx_preguntas_banco_orden ON preguntas_banco(evaluacion_id, orden);

-- ============================================
-- Índices para opciones_pregunta
-- ============================================
CREATE INDEX idx_opciones_pregunta_pregunta ON opciones_pregunta(pregunta_id);
CREATE INDEX idx_opciones_pregunta_correcta ON opciones_pregunta(es_correcta);

-- ============================================
-- Índices para respuestas_correctas_vf
-- ============================================
CREATE INDEX idx_respuestas_vf_pregunta ON respuestas_correctas_vf(pregunta_id);

-- ============================================
-- Índices para intentos_evaluacion
-- ============================================
CREATE INDEX idx_intentos_evaluacion ON intentos_evaluacion(evaluacion_id);
CREATE INDEX idx_intentos_estudiante ON intentos_evaluacion(estudiante_id);
CREATE INDEX idx_intentos_estado ON intentos_evaluacion(estado);
CREATE INDEX idx_intentos_fecha_inicio ON intentos_evaluacion(fecha_inicio);

-- ============================================
-- Índices para preguntas_intento
-- ============================================
CREATE INDEX idx_preguntas_intento_intento ON preguntas_intento(intento_id);
CREATE INDEX idx_preguntas_intento_pregunta ON preguntas_intento(pregunta_id);

-- ============================================
-- Índices para respuestas_estudiante
-- ============================================
CREATE INDEX idx_respuestas_intento ON respuestas_estudiante(intento_id);
CREATE INDEX idx_respuestas_pregunta ON respuestas_estudiante(pregunta_id);
CREATE INDEX idx_respuestas_opcion ON respuestas_estudiante(opcion_seleccionada_id);

-- ============================================
-- Índices para imagenes_respuestas
-- ============================================
CREATE INDEX idx_imagenes_respuestas_respuesta ON imagenes_respuestas(respuesta_id);

-- ============================================
-- Triggers para actualizar fecha_actualizacion en evaluaciones
-- ============================================
CREATE TRIGGER trigger_actualizar_evaluaciones
    BEFORE UPDATE ON evaluaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- ============================================
-- Comentarios para tablas de evaluaciones
-- ============================================
COMMENT ON TABLE evaluaciones IS 'Evaluaciones/exámenes de un aula';
COMMENT ON COLUMN evaluaciones.estado IS 'Estado: borrador, publicado, cerrado';
COMMENT ON COLUMN evaluaciones.intentos_permitidos IS 'Número de intentos permitidos por estudiante';
COMMENT ON COLUMN evaluaciones.cantidad_preguntas_mostrar IS 'Cantidad de preguntas aleatorias a mostrar del banco';
COMMENT ON COLUMN evaluaciones.orden_aleatorio IS 'Si true, las preguntas se muestran en orden aleatorio';
COMMENT ON COLUMN evaluaciones.mostrar_respuestas_correctas IS 'Si true, se muestran respuestas correctas después de calificar';
COMMENT ON COLUMN evaluaciones.duracion_maxima_minutos IS 'Duración máxima del intento en minutos (NULL = sin límite)';

COMMENT ON TABLE preguntas_banco IS 'Banco de preguntas de una evaluación';
COMMENT ON COLUMN preguntas_banco.tipo_pregunta IS 'Tipo: multiple_choice, verdadero_falso, verdadero_falso_justificacion, desarrollo';

COMMENT ON TABLE opciones_pregunta IS 'Opciones para preguntas de múltiple choice';
COMMENT ON COLUMN opciones_pregunta.es_correcta IS 'Indica si esta opción es la respuesta correcta';

COMMENT ON TABLE respuestas_correctas_vf IS 'Respuestas correctas para preguntas de verdadero/falso';

COMMENT ON TABLE intentos_evaluacion IS 'Intentos de estudiantes en evaluaciones';
COMMENT ON COLUMN intentos_evaluacion.estado IS 'Estado: en_progreso, entregado, calificado';
COMMENT ON COLUMN intentos_evaluacion.numero_intento IS 'Número secuencial del intento (1, 2, 3...)';

COMMENT ON TABLE preguntas_intento IS 'Preguntas asignadas a un intento específico (subset del banco)';
COMMENT ON COLUMN preguntas_intento.orden_mostrado IS 'Orden en que se mostraron las preguntas al estudiante';

COMMENT ON TABLE respuestas_estudiante IS 'Respuestas del estudiante en un intento';
COMMENT ON COLUMN respuestas_estudiante.respuesta_texto IS 'Respuesta de texto libre (para preguntas de desarrollo)';
COMMENT ON COLUMN respuestas_estudiante.opcion_seleccionada_id IS 'Opción seleccionada (para multiple choice)';
COMMENT ON COLUMN respuestas_estudiante.respuesta_booleana IS 'Respuesta true/false (para V/F)';
COMMENT ON COLUMN respuestas_estudiante.justificacion IS 'Justificación del estudiante (para V/F con justificación)';
COMMENT ON COLUMN respuestas_estudiante.retroalimentacion_profesor IS 'Retroalimentación del profesor al calificar';

COMMENT ON TABLE imagenes_respuestas IS 'Imágenes adjuntas a respuestas de desarrollo';

-- ============================================
-- Mensaje de confirmación
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Base de datos AulaVirtual creada exitosamente';
    RAISE NOTICE 'Tablas básicas: usuarios, roles, usuario_roles, aulas, aula_profesores, aula_estudiantes';
    RAISE NOTICE 'Tablas de contenido: hojas_aula, contenido_aulas, archivos_aula';
    RAISE NOTICE 'Tablas de consultas: consultas, respuestas_consultas, imagenes_consultas';
    RAISE NOTICE 'Tablas de evaluaciones: evaluaciones, preguntas_banco, opciones_pregunta, respuestas_correctas_vf, intentos_evaluacion, preguntas_intento, respuestas_estudiante, imagenes_respuestas';
    RAISE NOTICE 'Roles insertados: admin, profesor, estudiante';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Sistema de hojas por aula:';
    RAISE NOTICE '  - Cada aula puede tener múltiples hojas (como pestañas de Excel)';
    RAISE NOTICE '  - Cada hoja contiene su propio contenido independiente';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Sistema de evaluaciones:';
    RAISE NOTICE '  - 4 tipos de preguntas: multiple_choice, verdadero_falso, verdadero_falso_justificacion, desarrollo';
    RAISE NOTICE '  - Calificación automática para MC y V/F, manual para desarrollo y V/F con justificación';
    RAISE NOTICE '  - Estados de intento: en_progreso, entregado, calificado';
    RAISE NOTICE '  - Estados de evaluación: borrador, publicado, cerrado';
    RAISE NOTICE '===========================================';
END $$;
