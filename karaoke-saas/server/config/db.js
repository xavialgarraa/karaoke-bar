const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();

// Crear el Pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convertimos el pool para usar Promesas (async/await)
const promisePool = pool.promise();

// Prueba de conexión
promisePool.query('SELECT 1')
  .then(() => console.log('✅ Conectado a MySQL correctamente'))
  .catch(err => console.error('❌ Error conectando a MySQL:', err.message));

module.exports = promisePool;