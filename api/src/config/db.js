const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool
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

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
};

// Initialize database tables if needed
const initializeDatabase = async () => {
  try {
    const conn = await pool.getConnection();
    
    // Create users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create sign_language_logs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sign_language_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        gesture_input TEXT,
        recognized_text TEXT,
        confidence FLOAT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create sign_language_dictionary table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sign_language_dictionary (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gesture_name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        example_image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    conn.release();
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
