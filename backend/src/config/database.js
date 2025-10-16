const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'AulaVirtual',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Número máximo de clientes en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar una conexión inactiva
  connectionTimeoutMillis: 2000, // Tiempo máximo de espera para conectar
});

// Evento cuando se conecta un cliente
pool.on('connect', () => {
  console.log('✓ Conexión a la base de datos establecida');
});

// Evento cuando hay un error
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL:', err);
  process.exit(-1);
});

// Función para verificar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✓ Base de datos conectada correctamente:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('✗ Error al conectar con la base de datos:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  query: (text, params) => pool.query(text, params),
};
