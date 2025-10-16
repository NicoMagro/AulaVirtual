const { verifyToken } = require('../utils/jwt');

/**
 * Middleware para verificar la autenticación del usuario
 * Valida el token JWT en el header Authorization
 */
const autenticar = (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
      });
    }

    // El formato esperado es: "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación inválido',
      });
    }

    // Verificar y decodificar el token
    const decoded = verifyToken(token);

    // Agregar la información del usuario al request
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    console.error('Error en autenticación:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

/**
 * Middleware para verificar que el usuario tenga un rol específico
 * @param {...string} rolesPermitidos - Roles permitidos para acceder a la ruta
 */
const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    // Verificar si el usuario tiene al menos uno de los roles permitidos
    const tieneRol = req.usuario.roles.some(rol =>
      rolesPermitidos.includes(rol)
    );

    if (!tieneRol) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
    }

    next();
  };
};

module.exports = {
  autenticar,
  autorizarRoles,
};
