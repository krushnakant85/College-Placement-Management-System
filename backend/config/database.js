const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to manage reusable MySQL connections efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
  user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'college_placement_system',
  port: (process.env.DB_PORT || process.env.DATABASE_PORT)
    ? parseInt(process.env.DB_PORT || process.env.DATABASE_PORT, 10)
    : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: (process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true')
    ? { rejectUnauthorized: false }
    : undefined,
});

module.exports = pool;
