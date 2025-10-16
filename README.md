# Aula Virtual

Sistema de gestión de aula virtual con autenticación de usuarios, roles y permisos.

## Tecnologías

### Backend
- Node.js + Express
- PostgreSQL
- JWT (autenticación)
- bcrypt (encriptación de contraseñas)
- express-validator (validaciones)

### Frontend
- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS

## Estructura del Proyecto

```
AulaVirtual/
├── backend/          # API REST con Node.js
│   ├── src/
│   │   ├── config/      # Configuración de la base de datos
│   │   ├── controllers/ # Controladores
│   │   ├── middlewares/ # Middleware de autenticación
│   │   ├── routes/      # Rutas de la API
│   │   ├── utils/       # Utilidades (JWT, etc.)
│   │   └── index.js     # Punto de entrada
│   └── package.json
│
└── frontend/         # Aplicación React
    ├── src/
    │   ├── components/  # Componentes reutilizables
    │   ├── contexts/    # Context API (autenticación)
    │   ├── pages/       # Páginas (Login, Registro, Dashboard)
    │   ├── services/    # Servicios API
    │   └── App.jsx
    └── package.json
```

## Requisitos Previos

- Node.js (v18 o superior)
- PostgreSQL (v14 o superior)
- npm o yarn

## Configuración

### 1. Base de Datos

Crea una base de datos PostgreSQL llamada `AulaVirtual` y ejecuta el script SQL ubicado en `backend/database/schema.sql` (si existe) o crea las siguientes tablas:

```sql
-- Ver script completo en la documentación de la base de datos
```

### 2. Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` en la carpeta `backend/`:

```env
PORT=5001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=AulaVirtual
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

JWT_SECRET=tu_secreto_jwt_muy_seguro
JWT_EXPIRES_IN=24h
```

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
npm start
```
El servidor correrá en `http://localhost:5001`

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

### Seguridad
- Contraseñas encriptadas con bcrypt
- Validación de datos con express-validator
- Protección contra inyección SQL (queries parametrizadas)
- CORS configurado
- Middleware de autenticación JWT

## API Endpoints

### Autenticación

**POST** `/api/auth/registro`
- Registra un nuevo usuario
- Body: `{ nombre, apellido, email, password }`
- Respuesta: `{ success, message, data: { usuario, token } }`

**POST** `/api/auth/login`
- Inicia sesión
- Body: `{ email, password }`
- Respuesta: `{ success, message, data: { usuario, token } }`

### Rutas Protegidas

Requieren header: `Authorization: Bearer <token>`

## Roles

- **estudiante**: Rol por defecto al registrarse
- **profesor**: Puede gestionar cursos y estudiantes
- **administrador**: Acceso completo al sistema

## Autor

Desarrollado por Angel Nicolas Magro

## Licencia

Este proyecto es privado y está bajo desarrollo.
