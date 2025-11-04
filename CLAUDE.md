# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Rules

- **Consistencia de nombres**: Siempre revisa en la Base de Datos los campos de las tablas antes de hacer una consulta. Los nombres de campos deben coincidir exactamente.
- **Nomenclatura de la BD**: La base de datos usa snake_case para nombres de tablas y columnas (ej: `aula_profesores`, `fecha_creacion`).
- **IDs**: Las tablas principales usan `uuid` como primary key, mientras que las tablas de roles/permisos usan `serial` (autoincremento).

## Project Overview

Sistema de gestión de aula virtual desarrollado con:
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Autenticación**: JWT con bcrypt para encriptación de contraseñas

### Sistema de Roles y Multi-rol

El sistema permite que los usuarios tengan múltiples roles simultáneamente y puedan cambiar entre ellos:
- Los usuarios se guardan en la tabla `usuarios`
- Los roles se asignan en `usuario_roles` (relación many-to-many)
- El frontend maneja el rol activo con `AuthContext` y lo persiste en `localStorage`
- El backend valida permisos usando el middleware `autorizarRoles(...roles)` que verifica si el usuario tiene al menos uno de los roles permitidos

## Development Commands

### Backend
```bash
cd backend
npm install              # Instalar dependencias
npm run dev             # Desarrollo con nodemon (auto-reload)
npm start               # Producción (node directo)
```
El servidor corre por defecto en `http://localhost:5001` (puerto configurable en .env)

### Frontend
```bash
cd frontend
npm install              # Instalar dependencias
npm run dev             # Desarrollo con Vite HMR
npm run build           # Build para producción
npm run preview         # Preview del build
npm run lint            # Ejecutar ESLint
```
La app corre por defecto en `http://localhost:5173`

### Database Setup
```bash
# 1. Crear base de datos
psql -U postgres -c "CREATE DATABASE AulaVirtual;"

# 2. Ejecutar script de inicialización (crea tablas, roles, índices, triggers)
psql -U postgres -d AulaVirtual -f context/init.sql

# 3. (Opcional) Cargar usuarios de prueba
psql -U postgres -d AulaVirtual -f context/usuarios_prueba.sql
```

## Architecture

### Backend Structure

```
backend/src/
├── config/
│   └── database.js          # Pool de conexiones PostgreSQL
├── controllers/             # Lógica de negocio
│   ├── authController.js    # Login, registro, verificación
│   ├── aulasController.js   # CRUD de aulas
│   ├── matriculacionController.js
│   ├── hojasController.js   # Pestañas/hojas del aula
│   ├── contenidoController.js  # Bloques de contenido
│   ├── archivosController.js   # Subida de archivos
│   ├── consultasController.js  # Sistema de consultas
│   ├── evaluacionesController.js
│   ├── preguntasController.js  # Banco de preguntas
│   ├── intentosController.js   # Intentos de evaluación
│   ├── notificacionesController.js  # Notificaciones en tiempo real
│   └── usuariosController.js   # Gestión de usuarios (admin)
├── middlewares/
│   └── auth.js              # autenticar() y autorizarRoles()
├── routes/                  # Definición de endpoints
├── socket/                  # WebSocket con Socket.IO
│   └── socketHandler.js    # Gestión de conexiones y eventos
├── utils/
│   └── jwt.js              # generateToken() y verifyToken()
└── index.js                # Entry point (incluye config de Socket.IO)
```

**Patrón de arquitectura**: Cada módulo sigue el patrón Routes → Middleware → Controller → Database
- Las rutas definen endpoints y aplican middlewares
- Los middlewares validan autenticación y autorización
- Los controllers ejecutan queries parametrizadas contra PostgreSQL
- Todas las queries usan placeholders ($1, $2) para prevenir SQL injection

### Frontend Structure

```
frontend/src/
├── components/
│   ├── admin/              # Componentes específicos de administrador
│   ├── profesor/           # Componentes específicos de profesor
│   ├── estudiante/         # Componentes específicos de estudiante
│   ├── landing/            # Landing page pública
│   │   ├── LandingNavbar.jsx
│   │   └── ParallaxSection.jsx
│   ├── contenido/          # Sistema de bloques editables
│   │   ├── BloqueContenido.jsx    # 6 tipos: titulo, subtitulo, parrafo, lista, enlace, separador
│   │   ├── ModalEditarBloque.jsx
│   │   ├── TabsHojas.jsx          # Pestañas del aula
│   │   └── ListaArchivos.jsx
│   ├── evaluaciones/       # Sistema completo de evaluaciones
│   │   ├── BancoPreguntas.jsx     # 4 tipos: MC, V/F, V/F con justif, desarrollo
│   │   ├── RealizarEvaluacion.jsx
│   │   ├── CalificarIntento.jsx
│   │   └── EstadisticasEvaluacion.jsx  # Con exportación Excel/PDF
│   ├── NotificacionesMenu.jsx  # Menú de notificaciones con badge
│   ├── Layout.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   ├── AuthContext.jsx     # Gestión de autenticación y rol activo
│   ├── SocketContext.jsx   # Gestión de WebSocket y notificaciones
│   └── ThemeContext.jsx
├── pages/
│   ├── LandingPage.jsx     # Página pública con parallax y modo oscuro automático
│   ├── Login.jsx / Registro.jsx
│   ├── Dashboard.jsx       # Redirección según rol activo
│   ├── VistaAula.jsx       # Vista principal del aula
│   ├── admin/
│   │   ├── GestionAulas.jsx
│   │   └── GestionUsuarios.jsx
│   ├── profesor/
│   │   └── MisAulas.jsx
│   └── estudiante/
│       ├── ExplorarAulas.jsx
│       └── MisAulas.jsx
└── services/               # Wrappers de Axios para API calls
    ├── api.js              # Cliente Axios base con interceptores
    ├── notificacionesService.js  # Servicio de notificaciones
    └── *Service.js         # Un servicio por controlador
```

**Patrón de arquitectura**:
- `AuthContext` provee estado global de autenticación con `useAuth()` hook
- `ProtectedRoute` wrapper valida autenticación y roles
- Servicios usan Axios interceptors para inyectar token JWT automáticamente
- El token se guarda en `localStorage` y se incluye en header `Authorization: Bearer <token>`

## Database Schema

### Tablas Principales

**Usuarios y Roles**
- `usuarios`: id (uuid), nombre, apellido, email (unique), password_hash, activo
- `roles`: id (serial), nombre (unique) - Valores: 'admin', 'profesor', 'estudiante'
- `usuario_roles`: usuario_id, rol_id (PK compuesta)

**Aulas**
- `aulas`: id (uuid), nombre (unique), descripcion, capacidad_maxima, clave_matriculacion, activo, creado_por
- `aula_profesores`: aula_id, profesor_id (PK compuesta)
- `aula_estudiantes`: aula_id, estudiante_id (PK compuesta), fecha_matriculacion

**Contenido**
- `hojas_aula`: id (uuid), aula_id, nombre, orden, oculto_para_estudiantes - Pestañas para organizar contenido
- `contenido_aulas`: id (uuid), hoja_id, tipo (enum), contenido (jsonb), orden, oculto_para_estudiantes
- `archivos_aula`: id (uuid), aula_id, hoja_id, nombre_original, nombre_archivo (unique), tipo_mime, tamano_bytes, oculto_para_estudiantes

**Consultas**
- `consultas`: id (uuid), aula_id, estudiante_id, titulo, descripcion, es_publica, resuelta
- `respuestas_consultas`: id (uuid), consulta_id, usuario_id, contenido
- `imagenes_consultas`: id (uuid), consulta_id, respuesta_id, nombre_archivo (limite 10 MB)

**Evaluaciones**
- `evaluaciones`: id (uuid), aula_id, hoja_id, titulo, descripcion, nota_minima_aprobacion, fecha_inicio, fecha_fin, duracion_maxima_minutos, intentos_permitidos, cantidad_preguntas_mostrar, orden_aleatorio, mostrar_respuestas_correctas, estado ('borrador' | 'publicado' | 'cerrado')
- `preguntas_banco`: id (uuid), evaluacion_id, enunciado, tipo_pregunta ('multiple_choice' | 'verdadero_falso' | 'verdadero_falso_justificacion' | 'desarrollo'), puntaje, respuesta_correcta (boolean, para V/F), requiere_justificacion
- `opciones_pregunta`: id (uuid), pregunta_id, texto, es_correcta, orden
- `imagenes_preguntas`: id (uuid), pregunta_id, nombre_archivo (limite 10 MB)
- `imagenes_opciones`: id (uuid), opcion_id, nombre_archivo

**Intentos**
- `intentos_evaluacion`: id (uuid), evaluacion_id, estudiante_id, numero_intento, fecha_inicio, fecha_entrega, puntaje_obtenido, puntaje_total, nota_obtenida (0-10), tiempo_usado_minutos, estado ('en_progreso' | 'entregado' | 'calificado')
- `preguntas_intento`: id (uuid), intento_id, pregunta_id, enunciado (snapshot), tipo_pregunta, puntaje_maximo, respuesta_correcta, opciones (jsonb snapshot), orden
- `respuestas_estudiante`: id (uuid), intento_id, pregunta_id, respuesta_texto, opcion_seleccionada_id, respuesta_booleana, justificacion, es_correcta, puntaje_obtenido, retroalimentacion_profesor, calificado_por
- `opciones_seleccionadas_estudiante`: id (uuid), respuesta_id, opcion_id - Para múltiples selecciones

**Notificaciones**
- `notificaciones`: id (uuid), usuario_id, tipo, titulo, mensaje, aula_id, consulta_id, leida, fecha_creacion, fecha_lectura

### Índices y Optimizaciones

- Índices en FK para joins rápidos
- Índices en campos de búsqueda frecuente (email, estado, fecha_inicio)
- Triggers automáticos para actualizar `fecha_actualizacion` en UPDATE

## Key Features

### Sistema de Evaluaciones con Puntaje Proporcional

**Multiple Choice con múltiples respuestas correctas**:
- Los profesores pueden marcar varias opciones como correctas
- Los estudiantes ven checkboxes en lugar de radio buttons
- El sistema calcula puntaje proporcional: `(correctas_seleccionadas / total_correctas) × puntaje`
- Las opciones incorrectas NO penalizan, solo se cuentan las selecciones correctas
- Ejemplo: 3 opciones correctas, estudiante marca 2 → obtiene 66.67% del puntaje

**Calificación Manual**:
- Preguntas de desarrollo y V/F con justificación requieren calificación manual
- Profesor ve intento con todas las respuestas
- Puede asignar puntaje y retroalimentación por pregunta
- Al publicar resultados, el sistema recalcula la nota final automáticamente

**Estadísticas y Exportación**:
- Métricas: promedio, min, max, tasa de aprobación, tiempo promedio
- Distribución de notas en rangos (0-2, 2-4, etc.)
- Rendimiento por pregunta (% de acierto, puntaje promedio)
- Exportación a Excel (4 hojas) con ExcelJS
- Exportación a PDF con gráficos usando PDFKit + chartjs-node-canvas

### Sistema de Hojas/Pestañas

Las aulas se organizan en hojas/pestañas para estructurar el contenido:
- Cada hoja tiene nombre y orden
- Los profesores pueden ocultar hojas completas para estudiantes
- Los bloques de contenido y archivos se asocian a una hoja específica
- Los estudiantes solo ven las hojas y contenido no ocultos

### Drag and Drop

El sistema de contenido usa `@dnd-kit` para reordenar bloques:
- Los profesores pueden arrastrar bloques para cambiar el orden
- El orden se persiste en la BD (campo `orden` en `contenido_aulas`)
- Funciona con touch para dispositivos móviles

### Landing Page

Página pública moderna con:
- Detección automática de modo oscuro del sistema operativo
- Efecto parallax con figuras geométricas decorativas
- Animaciones con Framer Motion
- Sección de contacto con variables de entorno (`VITE_CONTACT_EMAIL`, `VITE_CONTACT_LINKEDIN`, `VITE_CONTACT_GITHUB`)
- Diseño responsivo con Tailwind CSS

## Environment Variables

### Backend (.env)
```env
PORT=5001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=AulaVirtual
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=secret_super_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=24h
```

### Frontend (.env)
```env
VITE_CONTACT_EMAIL=tu-email@ejemplo.com
VITE_CONTACT_LINKEDIN=https://www.linkedin.com/in/tu-perfil
VITE_CONTACT_GITHUB=https://github.com/tu-usuario
```

## Common Patterns

### Backend: Verificar permisos de profesor en aula

```javascript
// Verificar si el usuario es profesor del aula o admin
const verificarProfesor = async (req, res) => {
  const { aula_id } = req.params;
  const usuario_id = req.usuario.id;
  const roles = req.usuario.roles;

  if (roles.includes('admin')) {
    return true;
  }

  const result = await pool.query(
    'SELECT * FROM aula_profesores WHERE aula_id = $1 AND profesor_id = $2',
    [aula_id, usuario_id]
  );

  return result.rows.length > 0;
};
```

### Frontend: Proteger ruta con rol específico

```jsx
<Route
  path="/profesor/aulas"
  element={
    <ProtectedRoute rolesPermitidos={['profesor']}>
      <MisAulas />
    </ProtectedRoute>
  }
/>
```

### Frontend: Usar contexto de autenticación

```jsx
import { useAuth } from '../contexts/AuthContext';

function MiComponente() {
  const { user, rolActivo, cambiarRol, logout } = useAuth();

  return (
    <div>
      <p>Usuario: {user?.nombre}</p>
      <p>Rol activo: {rolActivo}</p>
      {user?.roles?.map(rol => (
        <button onClick={() => cambiarRol(rol)}>{rol}</button>
      ))}
    </div>
  );
}
```

## File Upload

### Archivos de Aula
- Ruta: `backend/uploads/archivos/`
- Límite: 100 MB por archivo
- Tipos soportados: PDF, Office, imágenes, videos, etc.
- Multer config: `archivosController.js`

### Imágenes de Consultas
- Ruta: `backend/uploads/consultas/`
- Límite: 10 MB por imagen
- Formatos: JPEG, PNG, GIF, WebP

### Imágenes de Evaluaciones
- Ruta: `backend/uploads/evaluaciones/`
- Límite: 10 MB por imagen
- Se pueden adjuntar a preguntas y opciones de respuesta

## API Patterns

### Respuesta exitosa estándar
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Respuesta de error estándar
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

### Autenticación
Todas las rutas protegidas requieren:
```
Authorization: Bearer <jwt_token>
```

El middleware `autenticar` inyecta `req.usuario` con: `{ id, email, roles }`

## Testing Users (si ejecutaste usuarios_prueba.sql)

- **Admin**: admin@aulavirtual.com / admin123
- **Profesor**: profesor1@aulavirtual.com / profesor123
- **Estudiante**: estudiante1@aulavirtual.com / estudiante123

## Sistema de Notificaciones en Tiempo Real

El proyecto cuenta con un sistema completo de notificaciones implementado con WebSocket/Socket.IO:

### Arquitectura

**Backend:**
- Socket.IO configurado en `backend/src/index.js`
- Handler en `backend/src/socket/socketHandler.js`
- Controller en `backend/src/controllers/notificacionesController.js`
- Rutas API en `backend/src/routes/notificacionesRoutes.js`

**Frontend:**
- Context en `frontend/src/contexts/SocketContext.jsx`
- Componente UI en `frontend/src/components/NotificacionesMenu.jsx`
- Servicio en `frontend/src/services/notificacionesService.js`

**Base de Datos:**
- Tabla `notificaciones` con campos: id, usuario_id, tipo, titulo, mensaje, aula_id, consulta_id, leida, fecha_creacion, fecha_lectura
- Índices en usuario_id, leida, aula_id, consulta_id, fecha_creacion

### Flujo de Notificaciones

**Conexión:**
1. Usuario inicia sesión → Frontend crea conexión Socket.IO
2. Frontend envía evento `authenticate` con token JWT
3. Backend verifica token y almacena usuario conectado en Map
4. Frontend carga historial de notificaciones desde API REST

**Envío de Notificaciones:**
1. Ocurre un evento (nueva consulta, respuesta, etc.)
2. Backend llama `crearNotificacion()` que:
   - Inserta en BD (tabla `notificaciones`)
   - Emite evento WebSocket `nueva_notificacion` si el usuario está conectado
3. Frontend recibe evento y:
   - Agrega notificación al estado
   - Incrementa contador badge
   - Muestra notificación del navegador (si hay permiso)

**Tipos de Notificaciones:**
- `nueva_consulta`: Para profesores cuando se crea una consulta
- `nueva_respuesta`: Para usuarios involucrados en una consulta
- `consulta_resuelta`: Para profesores cuando se marca como resuelta

### Integración con Consultas

En `backend/src/controllers/consultasController.js`:
- Al crear consulta → notifica a todos los profesores del aula
- Al crear respuesta → notifica al creador de la consulta y a todos los que participaron
- Al marcar resuelta → notifica a todos los profesores del aula

### API Endpoints

- `GET /api/notificaciones` - Obtener notificaciones (con filtros)
- `PUT /api/notificaciones/:id/leida` - Marcar como leída
- `PUT /api/notificaciones/marcar-todas-leidas` - Marcar todas
- `DELETE /api/notificaciones/:id` - Eliminar notificación

### Uso en Frontend

```jsx
import { useSocket } from '../contexts/SocketContext';

function MyComponent() {
  const {
    notificaciones,
    notificacionesNoLeidas,
    marcarComoLeida
  } = useSocket();

  // El componente tiene acceso a todas las notificaciones
}
```

## Known Issues / Limitations

- No hay paginación en listados largos de evaluaciones e intentos (pendiente optimización)
