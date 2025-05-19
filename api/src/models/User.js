const { pool } = require('../config/db');

/**
 * User model functions
 */
class User {
  /**
   * Find user by id
   * @param {number} id - User id
   * @returns {Promise<Object|null>} - User object or null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
        [id]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }
  
  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null
   */
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email
   * @param {string} userData.password - Password
   * @param {string} userData.role - Role (optional)
   * @returns {Promise<Object>} - Created user object
   */
  static async create(userData) {
    try {
      const { username, email, password, role = 'user' } = userData;
      
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, password, role]
      );
      
      return {
        id: result.insertId,
        username,
        email,
        role
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Update user data
   * @param {number} id - User id
   * @param {Object} updateData - Data to update
   * @returns {Promise<boolean>} - Success status
   */
  static async update(id, updateData) {
    try {
      // Build SET clause dynamically based on updateData
      const allowedFields = ['username', 'email', 'password', 'role'];
      const updates = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (updates.length === 0) {
        return false;
      }
      
      values.push(id);
      
      const [result] = await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user
   * @param {number} id - User id
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User;
