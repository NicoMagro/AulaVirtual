# Backend - AulaVirtual

Sistema de autenticación para Aula Virtual desarrollado con Node.js, Express y PostgreSQL.

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── controllers/
│   │   └── authController.js    # Controladores de autenticación
│   ├── routes/
│   │   └── authRoutes.js        # Rutas de autenticación
│   ├── middlewares/             # Middlewares personalizados
│   ├── utils/
│   │   └── jwt.js               # Utilidades para JWT
│   └── index.js                 # Punto de entrada del servidor
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de variables de entorno
├── package.json
└── README.md
```

## Instalación

1. Instalar las dependencias:
```bash
cd backend
npm install
```

2. Configurar las variables de entorno:
   - Duplicar `.env.example` a `.env`
   - Configurar las credenciales de PostgreSQL
   - Configurar el JWT_SECRET

3. Crear la base de datos:
```bash
psql -U postgres -f ../context/init.sql
```

## Ejecutar el Servidor

Modo desarrollo (con nodemon):
```bash
npm run dev
```

Modo producción:
```bash
npm start
```

El servidor estará corriendo en `http://localhost:5000`

## API Endpoints

### Autenticación

#### Registro de Usuario
```http
POST /api/auth/registro
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "password": "Password123"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "usuario": {
      "id": "uuid",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "activo": true,
      "roles": ["estudiante"],
      "fecha_creacion": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

## Validaciones

### Registro
- **nombre**: Obligatorio, 2-100 caracteres, solo letras
- **apellido**: Obligatorio, 2-100 caracteres, solo letras
- **email**: Obligatorio, formato email válido, único
- **password**: Obligatorio, mínimo 6 caracteres, debe contener mayúscula, minúscula y número

## Tecnologías

- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **PostgreSQL** - Base de datos
- **bcrypt** - Encriptación de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **express-validator** - Validación de datos
- **cors** - Manejo de CORS
- **dotenv** - Variables de entorno

## Seguridad

- Contraseñas encriptadas con bcrypt (10 salt rounds)
- Autenticación basada en JWT
- Validación de datos de entrada
- Protección contra inyección SQL con queries parametrizadas
- CORS configurado
