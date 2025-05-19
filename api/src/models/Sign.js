const { pool } = require('../config/db');

/**
 * Sign model functions
 */
class Sign {
  /**
   * Create a new sign
   * @param {Object} signData - Sign data
   * @param {string} signData.gestureName - Gesture name
   * @param {string} signData.description - Description (optional)
   * @returns {Promise<Object>} - Created sign object
   */
  static async create(signData) {
    try {
      const { gestureName, description = null } = signData;
      
      const [result] = await pool.execute(
        'INSERT INTO signs (gestureName, description) VALUES (?, ?)',
        [gestureName, description]
      );
      
      return {
        id: result.insertId,
        gestureName,
        description
      };
    } catch (error) {
      console.error('Error creating sign:', error);
      throw error;
    }
  }
  
  /**
   * Find sign by id
   * @param {number} id - Sign id
   * @returns {Promise<Object|null>} - Sign object or null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM signs WHERE id = ?',
        [id]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding sign by id:', error);
      throw error;
    }
  }
  
  /**
   * Find sign by gesture name
   * @param {string} gestureName - Gesture name
   * @returns {Promise<Object|null>} - Sign object or null
   */
  static async findByGestureName(gestureName) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM signs WHERE gestureName = ?',
        [gestureName]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding sign by gesture name:', error);
      throw error;
    }
  }
  
  /**
   * Get all signs
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} - Array of sign objects
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const [rows] = await pool.execute(
        'SELECT * FROM signs ORDER BY gestureName LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding all signs:', error);
      throw error;
    }
  }
  
  /**
   * Update sign data
   * @param {number} id - Sign id
   * @param {Object} updateData - Data to update
   * @returns {Promise<boolean>} - Success status
   */
  static async update(id, updateData) {
    try {
      const allowedFields = ['gestureName', 'description'];
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
        `UPDATE signs SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating sign:', error);
      throw error;
    }
  }
  
  /**
   * Delete a sign
   * @param {number} id - Sign id
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM signs WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting sign:', error);
      throw error;
    }
  }
  
  /**
   * Get videos for a sign
   * @param {number} signId - Sign id
   * @returns {Promise<Array>} - Array of video objects
   */
  static async getVideos(signId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM videos WHERE signId = ? ORDER BY title',
        [signId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting videos for sign:', error);
      throw error;
    }
  }
  
  /**
   * Get courses containing a sign
   * @param {number} signId - Sign id
   * @returns {Promise<Array>} - Array of course objects
   */
  static async getCourses(signId) {
    try {
      const [rows] = await pool.execute(
        `SELECT c.* FROM courses c
         JOIN course_sign cs ON c.id = cs.courseId
         WHERE cs.signId = ?
         ORDER BY c.title`,
        [signId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting courses for sign:', error);
      throw error;
    }
  }
}

module.exports = Sign;
