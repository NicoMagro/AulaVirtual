# Aula Virtual

Sistema de gestión de aula virtual con autenticación de usuarios, roles y permisos.

## Arquitectura del Sistema

```mermaid
graph TB
    subgraph "Frontend - React"
        A[Components]
        B[Pages]
        C[Services/API]
        D[Context/Auth]
    end

    subgraph "Backend - Node.js/Express"
        E[Routes]
        F[Controllers]
        G[Middlewares]
        H[Utils]
    end

    subgraph "Base de Datos - PostgreSQL"
        I[(usuarios)]
        J[(roles)]
        K[(aulas)]
        L[(aula_profesores)]
        M[(aula_estudiantes)]
        N[(hojas_aula)]
        O[(contenido_aulas)]
        P[(archivos_aula)]
        Q[(consultas)]
        R[(respuestas_consultas)]
    end

    A --> C
    B --> C
    C --> |HTTP/REST| E
    D --> |JWT Token| E
    E --> G
    G --> F
    F --> I
    F --> J
    F --> K
    F --> L
    F --> M
    F --> N
    F --> O
    F --> P
    F --> Q
    F --> R
    H -.-> G
```

## Modelo de Datos

```mermaid
erDiagram
    usuarios ||--o{ usuario_roles : tiene
    roles ||--o{ usuario_roles : asigna
    usuarios ||--o{ aulas : crea
    usuarios ||--o{ aula_profesores : asignado_como
    usuarios ||--o{ aula_estudiantes : matriculado_como
    usuarios ||--o{ hojas_aula : crea
    usuarios ||--o{ contenido_aulas : crea
    usuarios ||--o{ archivos_aula : sube
    usuarios ||--o{ consultas : crea
    usuarios ||--o{ respuestas_consultas : responde
    aulas ||--o{ aula_profesores : tiene
    aulas ||--o{ aula_estudiantes : tiene
    aulas ||--o{ hojas_aula : contiene
    aulas ||--o{ archivos_aula : contiene
    aulas ||--o{ consultas : contiene
    consultas ||--o{ respuestas_consultas : tiene
    hojas_aula ||--o{ contenido_aulas : organiza
    hojas_aula ||--o{ archivos_aula : organiza
    hojas_aula ||--o{ consultas : referencia
    contenido_aulas ||--o{ consultas : referencia
    archivos_aula ||--o{ consultas : referencia

    usuarios {
        uuid id PK
        varchar nombre
        varchar apellido
        varchar email UK
        varchar password_hash
        boolean activo
        timestamp fecha_creacion
        timestamp fecha_actualizacion
    }

    roles {
        serial id PK
        varchar nombre UK
        text descripcion
        timestamp fecha_creacion
    }

    usuario_roles {
        uuid usuario_id FK
        int rol_id FK
        timestamp asignado_en
    }

    aulas {
        uuid id PK
        varchar nombre UK
        text descripcion
        int capacidad_maxima
        varchar clave_matriculacion
        boolean activo
        uuid creado_por FK
        timestamp fecha_creacion
        timestamp fecha_actualizacion
    }

    aula_profesores {
        uuid aula_id FK
        uuid profesor_id FK
        uuid asignado_por FK
        timestamp asignado_en
        boolean activo
    }

    aula_estudiantes {
        uuid aula_id FK
        uuid estudiante_id FK
        timestamp fecha_matriculacion
        boolean activo
    }

    hojas_aula {
        uuid id PK
        uuid aula_id FK
        varchar nombre
        int orden
        boolean visible
        boolean activo
        uuid creado_por FK
        timestamp fecha_creacion
        timestamp fecha_actualizacion
    }

    contenido_aulas {
        uuid id PK
        uuid aula_id FK
        uuid hoja_id FK
        varchar tipo
        text contenido
        int orden
        boolean visible
        uuid creado_por FK
        timestamp fecha_creacion
        timestamp fecha_actualizacion
    }

    archivos_aula {
        uuid id PK
        uuid aula_id FK
        uuid hoja_id FK
        varchar nombre_original
        varchar nombre_archivo UK
        varchar tipo_mime
        bigint tamano_bytes
        text descripcion
        boolean visible
        uuid subido_por FK
        timestamp fecha_subida
        timestamp fecha_actualizacion
    }

    consultas {
        uuid id PK
        uuid aula_id FK
        uuid hoja_id FK
        uuid bloque_id FK
        uuid archivo_id FK
        uuid creado_por FK
        varchar titulo
        text pregunta
        boolean publica
        boolean resuelta
        timestamp fecha_creacion
        timestamp fecha_actualizacion
    }

    respuestas_consultas {
        uuid id PK
        uuid consulta_id FK
        uuid respondido_por FK
        text respuesta
        timestamp fecha_creacion
        timestamp fecha_actualizacion
    }
```

## Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    U->>F: Ingresa credenciales
    F->>B: POST /api/auth/login
    B->>DB: Buscar usuario por email
    DB-->>B: Datos del usuario
    B->>B: Verificar contraseña (bcrypt)
    B->>B: Generar JWT Token
    B-->>F: Token + datos usuario
    F->>F: Guardar token en localStorage
    F->>F: Actualizar AuthContext
    F-->>U: Redirigir a Dashboard

    Note over F,B: Siguientes peticiones incluyen token

    F->>B: GET /api/... (Header: Authorization)
    B->>B: Verificar JWT Token
    B->>B: Verificar roles
    B->>DB: Consultar datos
    DB-->>B: Datos solicitados
    B-->>F: Respuesta
```

## Roles y Permisos

```mermaid
graph TB
    subgraph "Roles del Sistema"
        A[Admin]
        P[Profesor]
        E[Estudiante]
    end

    subgraph "Funcionalidades Admin"
        A1[Crear Aulas]
        A2[Editar Aulas]
        A3[Eliminar Aulas]
        A4[Asignar Profesores]
        A5[Ver Todas las Aulas]
        A6[Gestionar Usuarios]
        A7[Asignar/Quitar Roles]
    end

    subgraph "Funcionalidades Profesor"
        P1[Ver Mis Aulas]
        P2[Gestionar Clave Matriculación]
        P3[Ver Estudiantes]
        P4[Entrar al Aula]
        P5[Gestionar Hojas del Aula]
        P6[Editar Contenido del Aula]
        P7[Agregar/Editar/Eliminar Bloques]
        P8[Reordenar Bloques con Drag&Drop]
        P9[Subir Archivos al Aula]
        P10[Ocultar/Mostrar Archivos]
        P11[Eliminar Archivos]
    end

    subgraph "Funcionalidades Estudiante"
        E1[Explorar Aulas]
        E2[Matricularse]
        E3[Ver Mis Aulas]
        E4[Desmatricularse]
        E5[Entrar al Aula]
        E6[Ver Contenido del Aula]
    end

    A --> A1 & A2 & A3 & A4 & A5 & A6 & A7
    P --> P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8 & P9 & P10 & P11
    E --> E1 & E2 & E3 & E4 & E5 & E6

    MR[Los usuarios pueden tener múltiples roles<br/>y cambiar entre ellos]
    style MR fill:#e1f5ff,stroke:#0066cc,stroke-width:2px
```

## Tecnologías

### Backend
- Node.js + Express
- PostgreSQL
- JWT (autenticación)
- bcrypt (encriptación de contraseñas)
- express-validator (validaciones)
- multer (subida de archivos)
- uuid (generación de IDs únicos)

### Frontend
- React 19
- Vite
- React Router DOM v7
- Axios
- Tailwind CSS v3
- Lucide React (iconos)
- @dnd-kit (drag and drop)
- PropTypes (validación de tipos)

## Estructura del Proyecto

```
AulaVirtual/
├── backend/          # API REST con Node.js
│   ├── src/
│   │   ├── config/           # Configuración de la base de datos
│   │   ├── controllers/      # Controladores de lógica de negocio
│   │   │   ├── archivosController.js
│   │   │   ├── authController.js
│   │   │   ├── aulasController.js
│   │   │   ├── consultasController.js
│   │   │   ├── contenidoController.js
│   │   │   ├── hojasController.js
│   │   │   ├── matriculacionController.js
│   │   │   └── usuariosController.js
│   │   ├── middlewares/      # Middleware de autenticación y autorización
│   │   │   └── auth.js
│   │   ├── routes/           # Definición de rutas de la API
│   │   │   ├── archivosRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── aulasRoutes.js
│   │   │   ├── consultasRoutes.js
│   │   │   ├── contenidoRoutes.js
│   │   │   ├── hojasRoutes.js
│   │   │   ├── matriculacionRoutes.js
│   │   │   └── usuariosRoutes.js
│   │   ├── utils/            # Utilidades (JWT, etc.)
│   │   │   └── jwt.js
│   │   └── index.js          # Punto de entrada del servidor
│   ├── uploads/          # Archivos subidos por usuarios (no versionado)
│   └── package.json
│
├── frontend/         # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── admin/        # Componentes específicos de admin
│   │   │   ├── profesor/     # Componentes específicos de profesor
│   │   │   ├── estudiante/   # Componentes específicos de estudiante
│   │   │   ├── contenido/    # Componentes de bloques de contenido
│   │   │   │   ├── BloqueContenido.jsx
│   │   │   │   ├── ModalEditarBloque.jsx
│   │   │   │   ├── TabsHojas.jsx
│   │   │   │   ├── ModalGestionarHojas.jsx
│   │   │   │   └── ListaArchivos.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/         # Context API (autenticación)
│   │   │   └── AuthContext.jsx
│   │   ├── pages/            # Páginas de la aplicación
│   │   │   ├── admin/        # Páginas de admin
│   │   │   │   ├── GestionAulas.jsx
│   │   │   │   └── GestionUsuarios.jsx
│   │   │   ├── profesor/     # Páginas de profesor
│   │   │   │   └── MisAulas.jsx
│   │   │   ├── estudiante/   # Páginas de estudiante
│   │   │   │   ├── ExplorarAulas.jsx
│   │   │   │   └── MisAulas.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Registro.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── VistaAula.jsx
│   │   ├── services/         # Servicios de API
│   │   │   ├── api.js
│   │   │   ├── archivosService.js
│   │   │   ├── authService.js
│   │   │   ├── aulasService.js
│   │   │   ├── contenidoService.js
│   │   │   ├── hojasService.js
│   │   │   ├── matriculacionService.js
│   │   │   └── usuariosService.js
│   │   └── App.jsx
│   └── package.json
│
└── context/          # Scripts y contexto de base de datos
    ├── init.sql                    # Script de inicialización de BD
    ├── migration_consultas.sql     # Script de migración para consultas
    └── usuarios_prueba.sql         # Script de usuarios de prueba
```

## Requisitos Previos

- Node.js (v18 o superior)
- PostgreSQL (v14 o superior)
- npm o yarn

## Configuración

### 1. Base de Datos

Crea una base de datos PostgreSQL llamada `AulaVirtual` y ejecuta los siguientes scripts:

```bash
# 1. Ejecuta el script de inicialización de base de datos
psql -U tu_usuario -d postgres -f context/init.sql

# 2. Ejecuta el script de usuarios de prueba (opcional)
psql -U tu_usuario -d AulaVirtual -f context/usuarios_prueba.sql
```

El script `init.sql` crea:
- Tablas: usuarios, roles, usuario_roles, aulas, aula_profesores, aula_estudiantes, hojas_aula, contenido_aulas, archivos_aula, consultas, respuestas_consultas
- Roles por defecto: admin, profesor, estudiante
- Índices para optimización
- Triggers para actualización automática de fechas
- Tipos de bloques de contenido: titulo, subtitulo, parrafo, lista, enlace, separador
- Sistema de hojas/pestañas para organizar contenido
- Sistema de archivos con límite de 100 MB por archivo
- Sistema de consultas públicas y privadas con respuestas

### Usuarios de Prueba

Si ejecutaste `usuarios_prueba.sql`, tendrás las siguientes credenciales:

**Administrador:**
- Email: `admin@aulavirtual.com`
- Contraseña: `admin123`

**Profesores:**
- Email: `profesor1@aulavirtual.com` - Contraseña: `profesor123`
- Email: `profesor2@aulavirtual.com` - Contraseña: `profesor123`

**Estudiantes:**
- Email: `estudiante1@aulavirtual.com` - Contraseña: `estudiante123`
- Email: `estudiante2@aulavirtual.com` - Contraseña: `estudiante123`

### 2. Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` en la carpeta `backend/`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=AulaVirtual
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_EXPIRES_IN=24h
```

Nota: Asegúrate de crear el archivo `.env` basándote en el ejemplo anterior con tus propias credenciales.

### 3. Frontend

```bash
cd frontend
npm install
```

## Ejecución

### Desarrollo

**Backend:**
```bash
cd backend
npm run dev
```
El servidor correrá en `http://localhost:5000`

**Frontend:**
```bash
cd frontend
npm run dev
```
La aplicación correrá en `http://localhost:5173`

### Producción

**Backend:**
```bash
cd backend
npm run build  # Si existe script de build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Funcionalidades

### Autenticación
- ✅ Registro de usuarios
- ✅ Login con email y contraseña
- ✅ Tokens JWT
- ✅ Protección de rutas
- ✅ Roles de usuario (estudiante, profesor, administrador)
- ✅ Usuarios con múltiples roles
- ✅ Selector de rol activo para usuarios con múltiples roles
- ✅ Context API para gestión de estado de autenticación

### Gestión de Aulas (Administrador)
- ✅ Crear aulas con nombre, descripción y capacidad
- ✅ Editar aulas existentes
- ✅ Eliminar/desactivar aulas
- ✅ Asignar profesores a aulas
- ✅ Desasignar profesores de aulas
- ✅ Ver lista completa de aulas del sistema

### Gestión de Usuarios (Administrador)
- ✅ Ver todos los usuarios del sistema con sus roles
- ✅ Agregar roles a usuarios
- ✅ Quitar roles de usuarios
- ✅ Protección: usuarios deben mantener al menos un rol
- ✅ Visualización de roles con códigos de color

### Funcionalidades del Profesor
- ✅ Ver aulas asignadas
- ✅ Gestionar clave de matriculación (pública o privada)
- ✅ Ver lista de estudiantes matriculados
- ✅ Ver información detallada de cada aula
- ✅ Entrar al aula y ver su contenido
- ✅ Modo edición para gestionar contenido
- ✅ Crear bloques de contenido (6 tipos diferentes)
- ✅ Editar bloques existentes
- ✅ Eliminar bloques
- ✅ Reordenar bloques con drag and drop
- ✅ Gestionar hojas/pestañas del aula
- ✅ Crear, editar y eliminar hojas
- ✅ Organizar contenido en diferentes hojas
- ✅ Ocultar/mostrar hojas completas para estudiantes
- ✅ Ocultar/mostrar bloques individuales para estudiantes
- ✅ Preparar contenido anticipadamente sin que estudiantes lo vean
- ✅ Subir archivos al aula (PDF, Office, imágenes, videos, etc.)
- ✅ Ocultar/mostrar archivos individuales para estudiantes
- ✅ Eliminar archivos subidos
- ✅ Límite de 100 MB por archivo
- ✅ Crear consultas públicas y privadas
- ✅ Responder consultas de estudiantes
- ✅ Eliminar consultas y respuestas

### Funcionalidades del Estudiante
- ✅ Explorar aulas disponibles
- ✅ Matricularse en aulas públicas
- ✅ Matricularse en aulas privadas (con clave)
- ✅ Ver aulas en las que está matriculado
- ✅ Desmatricularse de aulas
- ✅ Ver información de profesores asignados
- ✅ Entrar al aula y ver su contenido
- ✅ Visualizar todos los bloques de contenido del aula
- ✅ Descargar archivos compartidos por profesores
- ✅ Crear consultas públicas (todos ven) o privadas (solo profesores)
- ✅ Responder consultas públicas
- ✅ Marcar propias consultas como resueltas
- ✅ Eliminar propias consultas y respuestas

### Seguridad
- Contraseñas encriptadas con bcrypt
- Validación de datos con express-validator
- Protección contra inyección SQL (queries parametrizadas)
- CORS configurado
- Middleware de autenticación JWT

## API Endpoints

### Autenticación

**POST** `/api/auth/registro`
- Registra un nuevo usuario (rol estudiante por defecto)
- Body: `{ nombre, apellido, email, password }`
- Respuesta: `{ success, message, data: { usuario, token } }`

**POST** `/api/auth/login`
- Inicia sesión
- Body: `{ email, password }`
- Respuesta: `{ success, message, data: { usuario, token } }`

### Aulas (Admin)

Requieren header: `Authorization: Bearer <token>` y rol **admin**

**GET** `/api/aulas`
- Lista todas las aulas del sistema
- Respuesta: `{ success, data: [...aulas], total }`

**POST** `/api/aulas`
- Crea una nueva aula
- Body: `{ nombre, descripcion, capacidad_maxima }`
- Respuesta: `{ success, message, data: aula }`

**PUT** `/api/aulas/:id`
- Actualiza una aula existente
- Body: `{ nombre, descripcion, capacidad_maxima, activo }`
- Respuesta: `{ success, message, data: aula }`

**DELETE** `/api/aulas/:id`
- Elimina (desactiva) un aula
- Respuesta: `{ success, message }`

**POST** `/api/aulas/asignar-profesor`
- Asigna un profesor a un aula
- Body: `{ aula_id, profesor_id }`
- Respuesta: `{ success, message }`

**DELETE** `/api/aulas/desasignar-profesor/:aula_id/:profesor_id`
- Desasigna un profesor de un aula
- Respuesta: `{ success, message }`

### Matriculación - Profesores

Requieren header: `Authorization: Bearer <token>` y rol **profesor**

**PUT** `/api/matriculacion/aula/clave`
- Gestiona la clave de matriculación de un aula
- Body: `{ aula_id, clave_matriculacion }` (null = aula pública)
- Respuesta: `{ success, message, data }`

**GET** `/api/matriculacion/aula/:aula_id/estudiantes`
- Obtiene lista de estudiantes de un aula
- Respuesta: `{ success, data: [...estudiantes], total }`

### Matriculación - Estudiantes

Requieren header: `Authorization: Bearer <token>` y rol **estudiante**

**GET** `/api/matriculacion/aulas-disponibles`
- Lista todas las aulas disponibles para matriculación
- Respuesta: `{ success, data: [...aulas], total }`

**POST** `/api/matriculacion/matricularse`
- Matricularse en un aula
- Body: `{ aula_id, clave_matriculacion }` (clave solo si es requerida)
- Respuesta: `{ success, message, data }`

**GET** `/api/matriculacion/mis-aulas`
- Lista aulas donde el estudiante está matriculado
- Respuesta: `{ success, data: [...aulas], total }`

**DELETE** `/api/matriculacion/desmatricularse/:aula_id`
- Desmatricularse de un aula
- Respuesta: `{ success, message }`

### Usuarios (Admin)

Requieren header: `Authorization: Bearer <token>` y rol **admin**

**GET** `/api/usuarios`
- Obtener todos los usuarios del sistema con sus roles
- Respuesta: `{ success, data: [...usuarios], total }`

**GET** `/api/usuarios/roles`
- Obtener todos los roles disponibles del sistema
- Respuesta: `{ success, data: [...roles], total }`

**GET** `/api/usuarios/por-rol`
- Listar usuarios filtrados por rol
- Query params: `rol` (admin/profesor/estudiante), `busqueda` (opcional)
- Respuesta: `{ success, data: [...usuarios], total }`

**POST** `/api/usuarios/agregar-rol`
- Agregar un rol a un usuario
- Body: `{ usuario_id, rol_id }`
- Respuesta: `{ success, message }`

**DELETE** `/api/usuarios/:usuario_id/roles/:rol_id`
- Quitar un rol de un usuario (requiere tener mínimo 2 roles)
- Respuesta: `{ success, message }`

### Contenido de Aulas

Requieren header: `Authorization: Bearer <token>`

**GET** `/api/contenido/aula/:aula_id?hoja_id=<uuid>`
- Obtener todo el contenido de una hoja específica de un aula ordenado
- Requiere query parameter `hoja_id`
- Acceso: Profesores asignados, estudiantes matriculados, admin
- Respuesta: `{ success, data: [...bloques], total }`

**POST** `/api/contenido/bloque`
- Crear un nuevo bloque de contenido
- Acceso: Solo profesores asignados al aula
- Body: `{ aula_id, hoja_id, tipo, contenido, orden }`
- Tipos válidos: `titulo`, `subtitulo`, `parrafo`, `lista`, `enlace`, `separador`
- Respuesta: `{ success, message, data: bloque }`

**PUT** `/api/contenido/bloque/:bloque_id`
- Actualizar un bloque de contenido existente
- Acceso: Solo profesores asignados al aula
- Body: `{ tipo, contenido, orden }`
- Respuesta: `{ success, message, data: bloque }`

**DELETE** `/api/contenido/bloque/:bloque_id`
- Eliminar un bloque de contenido
- Acceso: Solo profesores asignados al aula
- Respuesta: `{ success, message }`

**PUT** `/api/contenido/reordenar`
- Reordenar bloques de contenido mediante drag and drop
- Acceso: Solo profesores asignados al aula
- Body: `{ aula_id, bloques: [{id, orden}, ...] }`
- Respuesta: `{ success, message }`

**PUT** `/api/contenido/bloque/:bloque_id/visible`
- Cambiar visibilidad de un bloque (toggle visible/oculto)
- Acceso: Solo profesores asignados al aula
- Respuesta: `{ success, message, data: bloque }`

### Hojas de Aulas

Requieren header: `Authorization: Bearer <token>`

**GET** `/api/hojas/aula/:aula_id`
- Obtener todas las hojas de un aula ordenadas
- Acceso: Profesores asignados, estudiantes matriculados, admin
- Respuesta: `{ success, data: [...hojas], total }`

**POST** `/api/hojas`
- Crear una nueva hoja en un aula
- Acceso: Solo profesores asignados al aula
- Body: `{ aula_id, nombre, orden }`
- Respuesta: `{ success, message, data: hoja }`

**PUT** `/api/hojas/:hoja_id`
- Actualizar una hoja existente (nombre y/u orden)
- Acceso: Solo profesores asignados al aula
- Body: `{ nombre, orden }`
- Respuesta: `{ success, message, data: hoja }`

**DELETE** `/api/hojas/:hoja_id`
- Eliminar una hoja (no se puede eliminar si es la única)
- Acceso: Solo profesores asignados al aula
- Respuesta: `{ success, message }`

**PUT** `/api/hojas/reordenar/bulk`
- Reordenar múltiples hojas a la vez
- Acceso: Solo profesores asignados al aula
- Body: `{ aula_id, hojas: [{id, orden}, ...] }`
- Respuesta: `{ success, message }`

**PUT** `/api/hojas/:hoja_id/visible`
- Cambiar visibilidad de una hoja (toggle visible/oculta)
- Acceso: Solo profesores asignados al aula
- Respuesta: `{ success, message, data: hoja }`

### Archivos de Aulas

Requieren header: `Authorization: Bearer <token>`

**POST** `/api/archivos/subir`
- Subir un archivo al aula
- Acceso: Solo profesores asignados al aula
- Body: FormData con `archivo`, `aula_id`, `hoja_id`, `descripcion` (opcional)
- Respuesta: `{ success, message, data: archivo }`
- Límite: 100 MB por archivo
- Formatos soportados: PDF, Office, imágenes, videos, audio, comprimidos, etc.

**GET** `/api/archivos/aula/:aula_id?hoja_id=<uuid>`
- Obtener archivos de una hoja específica de un aula
- Query parameter `hoja_id` opcional (si no se especifica trae todos los archivos del aula)
- Acceso: Profesores asignados, estudiantes matriculados, admin
- Respuesta: `{ success, data: [...archivos] }`

**GET** `/api/archivos/descargar/:archivo_id`
- Descargar un archivo
- Acceso: Profesores y estudiantes matriculados (solo si visible)
- Respuesta: Archivo binario con headers para descarga

**DELETE** `/api/archivos/:archivo_id`
- Eliminar un archivo (físico y registro)
- Acceso: Solo profesores asignados al aula
- Respuesta: `{ success, message }`

**PUT** `/api/archivos/:archivo_id/visible`
- Cambiar visibilidad de un archivo (toggle visible/oculto)
- Acceso: Solo profesores asignados al aula
- Respuesta: `{ success, message, data: archivo }`

## Sistema de Hojas/Pestañas

Las aulas utilizan un sistema de hojas (similar a pestañas de Excel) para organizar el contenido de forma estructurada.

### Características
- Cada aula puede tener múltiples hojas con nombres personalizados
- Las hojas se muestran como pestañas en la parte superior del aula
- Cada hoja contiene su propio conjunto de bloques de contenido
- El contenido de cada hoja es independiente
- Los profesores pueden crear, editar y eliminar hojas
- Los estudiantes pueden navegar entre hojas para ver el contenido

### Gestión de Hojas (Profesores)

Los profesores asignados a un aula pueden:
- Crear nuevas hojas con nombres personalizados (ej: "General", "Unidad 1", "Evaluaciones")
- Editar el nombre y orden de las hojas existentes
- Eliminar hojas (protección: no se puede eliminar la única hoja del aula)
- Reordenar hojas para cambiar el orden de las pestañas
- Gestionar el contenido de cada hoja de forma independiente

### Visualización (Estudiantes)

Los estudiantes matriculados pueden:
- Ver todas las hojas disponibles como pestañas
- Cambiar entre hojas para acceder a diferentes secciones del contenido
- El contenido se carga dinámicamente al seleccionar una hoja

## Sistema de Contenido de Aulas

### Tipos de Bloques

El sistema soporta 6 tipos diferentes de bloques de contenido:

1. **Título**: Encabezado principal grande y destacado
2. **Subtítulo**: Encabezado secundario para secciones
3. **Párrafo**: Bloques de texto con soporte para saltos de línea
4. **Lista**: Listas con viñetas (un ítem por línea)
5. **Enlace**: Enlaces externos con texto personalizado (formato: `Texto|URL`)
6. **Separador**: Línea divisoria decorativa

### Gestión de Contenido (Profesores)

Los profesores asignados a un aula pueden:
- Activar el modo edición desde la vista del aula
- Agregar nuevos bloques seleccionando el tipo
- Editar bloques existentes (tipo, contenido y orden)
- Eliminar bloques con confirmación
- Reordenar bloques arrastrándolos con el mouse (drag and drop)
- Los cambios se guardan automáticamente en la base de datos

### Visualización (Estudiantes)

Los estudiantes matriculados pueden:
- Ver el contenido completo del aula
- Navegar entre diferentes bloques
- Acceder a enlaces externos
- Visualizar el contenido ordenado según configuración del profesor

## Sistema de Visibilidad de Contenido

El sistema permite a los profesores controlar qué contenido es visible para los estudiantes, facilitando la preparación anticipada de material sin publicarlo inmediatamente.

### Características Principales

**Control Granular:**
- **Hojas completas**: Ocultar pestañas/hojas enteras del aula
- **Bloques individuales**: Ocultar bloques específicos dentro de hojas visibles
- **Toggle rápido**: Cambiar visibilidad con un click

**Filtrado Automático:**
- **Estudiantes**: Solo ven contenido marcado como `visible=true`
- **Profesores/Admins**: Ven todo el contenido con indicadores visuales de lo oculto

### Uso para Profesores

**Preparación Anticipada:**
1. Crear contenido de clases futuras
2. Marcarlo como oculto
3. Los estudiantes no lo ven hasta que se active

**Gestión de Hojas:**
- Badge "Oculta" en pestañas no visibles
- Botón con icono de ojo al hacer hover sobre la pestaña
- Opacidad reducida para distinguir hojas ocultas
- Click en el icono para toggle visible/oculto

**Gestión de Bloques:**
- Border amarillo punteado para bloques ocultos
- Badge "Oculto para estudiantes" en la esquina del bloque
- Botón con icono de ojo en los controles de edición
- Colores diferentes: azul (visible) / amarillo (oculto)

### Casos de Uso

**Ejemplo 1: Preparar Unidad Futura**
```
1. Profesor crea hoja "Unidad 3"
2. Marca la hoja como oculta
3. Agrega todo el contenido de la unidad
4. Cuando llegue el momento, activa la hoja
5. Estudiantes ven instantáneamente todo el contenido
```

**Ejemplo 2: Ocultar Evaluación**
```
1. Profesor tiene hoja "Evaluaciones" visible
2. Crea bloque con "Examen Final"
3. Marca el bloque como oculto
4. El día del examen, lo activa
5. Solo ese bloque aparece para los estudiantes
```

### Indicadores Visuales

**Para Profesores:**
- Hojas ocultas: Badge amarillo + opacidad reducida
- Bloques ocultos: Border punteado amarillo + badge informativo
- Iconos: Ojo (visible) / Ojo tachado (oculto)

**Para Estudiantes:**
- No ven ningún indicador
- Simplemente no aparece el contenido oculto
- Experiencia limpia sin distracciones

## Sistema de Archivos

El sistema permite a los profesores compartir archivos con los estudiantes de forma organizada, con control de visibilidad y límites de tamaño.

### Características Principales

**Subida de Archivos:**
- Profesores pueden subir cualquier tipo de archivo educativo
- Límite: 100 MB por archivo
- Organización por hojas de aula
- Descripción opcional para cada archivo

**Formatos Soportados:**
- Documentos: PDF, Word (.doc, .docx)
- Hojas de cálculo: Excel (.xls, .xlsx), CSV
- Presentaciones: PowerPoint (.ppt, .pptx)
- Imágenes: JPEG, PNG, GIF, WebP, SVG
- Videos: MP4, MPEG, WebM
- Audio: MP3, WAV, WebM
- Comprimidos: ZIP, RAR, 7Z
- Texto: TXT, Markdown
- Otros: JSON, XML

**Control de Visibilidad:**
- Los profesores pueden ocultar archivos para estudiantes
- Útil para preparar material antes de publicarlo
- Toggle rápido con iconos de ojo

**Gestión de Archivos:**
- Lista de archivos con información detallada
- Iconos específicos por tipo de archivo
- Tamaño en formato legible (KB, MB, GB)
- Fecha de subida y nombre del profesor que lo subió
- Descarga directa con un click

### Uso para Profesores

**Subir Archivos:**
1. Entrar al aula y seleccionar una hoja
2. Click en "Subir Archivo"
3. Seleccionar archivo (máx 100 MB)
4. Agregar descripción opcional
5. El archivo se guarda y es visible para estudiantes

**Gestionar Visibilidad:**
- Click en el icono de ojo para ocultar/mostrar
- Archivos ocultos tienen badge "Oculto para estudiantes"
- Border punteado amarillo para diferenciar

**Eliminar Archivos:**
- Click en el icono de basura
- Confirmación antes de eliminar
- Se elimina tanto el archivo físico como el registro

### Uso para Estudiantes

**Descargar Archivos:**
1. Entrar al aula
2. Ver lista de archivos disponibles (solo visibles)
3. Click en botón de descarga
4. El archivo se descarga automáticamente

**Información Visible:**
- Nombre del archivo
- Descripción (si tiene)
- Tamaño del archivo
- Fecha de subida
- Profesor que lo subió

### Indicadores Visuales

**Iconos por Tipo:**
- PDF: Icono de documento rojo
- Excel/CSV: Icono de hoja de cálculo verde
- PowerPoint: Icono de presentación naranja
- Imágenes: Icono de imagen azul
- Videos: Icono de video púrpura
- Audio: Icono de música rosa
- Comprimidos: Icono de archivo amarillo
- Otros: Icono de archivo genérico gris

**Estados:**
- Visible: Icono de ojo azul
- Oculto: Icono de ojo tachado amarillo + border punteado

### Almacenamiento

- Los archivos se guardan en `/backend/uploads/`
- Nombres únicos generados con UUID para evitar conflictos
- Se preserva el nombre original para descargas
- La carpeta `uploads/` está excluida del repositorio (.gitignore)

## Roles y Múltiples Roles

### Roles Disponibles

- **estudiante**: Rol por defecto al registrarse. Puede explorar aulas, matricularse y desmatricularse
- **profesor**: Puede gestionar aulas asignadas, ver estudiantes y gestionar claves de matriculación
- **admin**: Acceso completo al sistema, gestión de aulas, usuarios y asignación de roles

### Sistema de Múltiples Roles

Los usuarios pueden tener múltiples roles asignados. Esto permite flexibilidad en el uso del sistema:

**Características:**
- Un usuario puede tener uno o más roles (admin, profesor, estudiante)
- Los usuarios con múltiples roles pueden cambiar entre ellos usando el selector en el navbar
- El rol activo determina qué funcionalidades y rutas están disponibles
- El rol activo se persiste en localStorage para mantener la selección entre sesiones

**Selector de Roles:**
- Aparece en la parte superior derecha del navbar (solo para usuarios con múltiples roles)
- Muestra todos los roles disponibles como badges con colores:
  - Admin: Rojo
  - Profesor: Azul
  - Estudiante: Verde
- El rol activo se destaca con un anillo
- Al cambiar de rol, la interfaz se actualiza automáticamente

**Caso de Uso:**
Un profesor puede tener también el rol de estudiante para:
1. Crear y configurar un aula como profesor
2. Cambiar al rol de estudiante para ver cómo se visualiza el aula desde la perspectiva del estudiante
3. Probar el proceso de matriculación
4. Verificar que todo funcione correctamente antes de compartir el aula

### Gestión de Roles (Admin)

El administrador puede:
- Ver todos los usuarios con sus roles actuales
- Agregar roles adicionales a cualquier usuario
- Quitar roles de usuarios (manteniendo mínimo 1 rol)
- Los cambios son inmediatos y no requieren que el usuario cierre sesión

## Autor

Desarrollado por Angel Nicolas Magro

## Licencia

Este proyecto es privado y está bajo desarrollo.

### Consultas de Aulas

Requieren header: `Authorization: Bearer <token>`

**POST** `/api/consultas`
- Crear una nueva consulta
- Acceso: Estudiantes y profesores del aula
- Body: `{ aula_id, titulo, pregunta, publica, hoja_id?, bloque_id?, archivo_id? }`
- `publica`: true = pública (todos ven), false = privada (solo profesores)
- Referencias opcionales a hojas, bloques o archivos
- Respuesta: `{ success, message, data: consulta }`

**GET** `/api/consultas/aula/:aula_id`
- Obtener todas las consultas de un aula
- Acceso: Profesores y estudiantes del aula
- Filtrado automático: estudiantes solo ven consultas públicas + sus propias privadas
- Respuesta: `{ success, data: [...consultas] }`

**GET** `/api/consultas/:consulta_id`
- Obtener detalle de una consulta con todas sus respuestas
- Acceso: Profesores, estudiantes del aula (si es pública o propia)
- Respuesta: `{ success, data: { consulta, respuestas: [...] } }`

**POST** `/api/consultas/:consulta_id/respuestas`
- Crear una respuesta a una consulta
- Body: `{ respuesta }`
- Acceso: Consultas públicas (todos), consultas privadas (solo profesores)
- Respuesta: `{ success, message, data: respuesta }`

**PUT** `/api/consultas/:consulta_id/resuelta`
- Marcar consulta como resuelta/pendiente (toggle)
- Acceso: Solo el creador de la consulta
- Respuesta: `{ success, message, data: consulta }`

**DELETE** `/api/consultas/:consulta_id`
- Eliminar una consulta y todas sus respuestas
- Acceso: Creador de la consulta o profesores del aula
- Respuesta: `{ success, message }`

**DELETE** `/api/consultas/respuestas/:respuesta_id`
- Eliminar una respuesta específica
- Acceso: Autor de la respuesta o profesores del aula
- Respuesta: `{ success, message }`

## Sistema de Consultas

El sistema de consultas permite la comunicación bidireccional entre estudiantes y profesores, facilitando el aprendizaje colaborativo.

### Características Principales

**Tipos de Consultas:**
- **Públicas**: Todos los usuarios del aula pueden ver y responder
- **Privadas**: Solo profesores y el creador pueden ver; solo profesores pueden responder

**Control de Estado:**
- El creador puede marcar su consulta como "resuelta"
- Filtros disponibles: todas, públicas, privadas, resueltas, pendientes

**Referencias Opcionales:**
- Las consultas pueden referenciar hojas, bloques de contenido o archivos específicos
- Útil para hacer preguntas contextuales sobre material del aula

**Múltiples Respuestas:**
- Sistema de thread/foro: múltiples usuarios pueden responder
- Respuestas ordenadas cronológicamente
- Contador de respuestas visible en la lista

### Uso para Estudiantes

**Crear Consulta:**
1. Entrar al aula
2. Ir a la sección "Consultas"
3. Click en "Nueva Consulta"
4. Escribir título y pregunta
5. Elegir visibilidad (pública o privada)
6. Crear la consulta

**Responder:**
- Ver consultas públicas de todos
- Ver solo propias consultas privadas
- Responder a consultas públicas
- Marcar propias consultas como resueltas

### Uso para Profesores

**Gestionar Consultas:**
- Ver todas las consultas (públicas y privadas)
- Responder cualquier consulta (públicas y privadas)
- Eliminar consultas inapropiadas
- Eliminar respuestas inapropiadas

**Consultas Privadas:**
- Los estudiantes pueden hacer consultas privadas para preguntas sensibles
- Solo profesores y el estudiante que creó la consulta pueden verla
- Solo profesores pueden responder

### Indicadores Visuales

**Iconos:**
- Globo (azul): Consulta pública
- Candado (naranja): Consulta privada
- CheckCircle (verde): Consulta resuelta
- Circle (gris): Consulta pendiente

**Contador de Respuestas:**
- Se muestra en cada consulta de la lista
- Se actualiza automáticamente al agregar/eliminar respuestas

**Botón Marcar como Resuelta:**
- Visible en tarjetas de consultas propias
- Toggle rápido entre resuelta/pendiente
- También disponible dentro del modal de detalle

### Casos de Uso

**Ejemplo 1: Duda sobre Ejercicio**
```
1. Estudiante crea consulta pública: "¿Cómo resolver el ejercicio 3?"
2. Otros estudiantes pueden ver y responder
3. Profesor puede dar la respuesta definitiva
4. Estudiante marca como resuelta cuando entiende
```

**Ejemplo 2: Consulta Personal**
```
1. Estudiante crea consulta privada: "Tengo problemas con las entregas"
2. Solo profesores ven la consulta
3. Profesor responde en privado
4. Estudiante marca como resuelta
```

**Ejemplo 3: Foro de Discusión**
```
1. Profesor crea consulta pública: "¿Qué opinan sobre el tema X?"
2. Múltiples estudiantes participan con respuestas
3. Se genera una discusión enriquecedora
4. Queda registrada para futura referencia
```
