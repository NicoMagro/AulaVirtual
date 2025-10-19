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
-- Mensaje de confirmación
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Base de datos AulaVirtual creada exitosamente';
    RAISE NOTICE 'Tablas creadas: usuarios, roles, usuario_roles, aulas, aula_profesores, aula_estudiantes, hojas_aula, contenido_aulas, archivos_aula, consultas, respuestas_consultas';
    RAISE NOTICE 'Roles insertados: admin, profesor, estudiante';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Sistema de hojas por aula:';
    RAISE NOTICE '  - Cada aula puede tener múltiples hojas (como pestañas de Excel)';
    RAISE NOTICE '  - Cada hoja contiene su propio contenido independiente';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tipos de bloques de contenido soportados:';
    RAISE NOTICE '  - titulo: Título principal';
    RAISE NOTICE '  - subtitulo: Subtítulo o encabezado';
    RAISE NOTICE '  - parrafo: Bloque de texto';
    RAISE NOTICE '  - lista: Lista de elementos';
    RAISE NOTICE '  - enlace: Enlace a recurso externo';
    RAISE NOTICE '  - separador: Línea separadora visual';
    RAISE NOTICE '===========================================';
END $$;
