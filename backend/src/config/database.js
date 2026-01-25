import mysql from 'mysql2/promise.js';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export async function initializeDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'yagnexor',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
    return pool;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
}

export function getDatabase() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

export async function getConnection() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool.getConnection();
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('Database connection closed');
  }
}
