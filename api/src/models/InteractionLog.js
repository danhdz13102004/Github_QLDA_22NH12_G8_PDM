const { pool } = require('../config/db');

/**
 * InteractionLog model functions
 */
class InteractionLog {
  /**
   * Create a new interaction log
   * @param {Object} logData - Log data
   * @param {number} logData.userId - User id
   * @param {string} logData.action - Action performed
   * @returns {Promise<Object>} - Created log object
   */
  static async create(logData) {
    try {
      const { userId, action } = logData;
      
      const [result] = await pool.execute(
        'INSERT INTO interaction_logs (userId, action) VALUES (?, ?)',
        [userId, action]
      );
      
      return {
        id: result.insertId,
        userId,
        action,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error creating interaction log:', error);
      throw error;
    }
  }
  
  /**
   * Find logs by user id
   * @param {number} userId - User id
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} - Array of log objects
   */
  static async findByUserId(userId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const [rows] = await pool.execute(
        'SELECT * FROM interaction_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding logs by user id:', error);
      throw error;
    }
  }
  
  /**
   * Get all logs
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} - Array of log objects
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const [rows] = await pool.execute(
        'SELECT * FROM interaction_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding all logs:', error);
      throw error;
    }
  }
  
  /**
   * Get user activity statistics
   * @param {number} userId - User id
   * @returns {Promise<Object>} - Activity statistics
   */
  static async getUserActivityStats(userId) {
    try {
      // Get total interactions
      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM interaction_logs WHERE userId = ?',
        [userId]
      );
      
      const totalInteractions = totalResult[0].total;
      
      // Get last activity
      const [lastActivityResult] = await pool.execute(
        'SELECT MAX(timestamp) as lastActive FROM interaction_logs WHERE userId = ?',
        [userId]
      );
      
      const lastActive = lastActivityResult[0].lastActive;
      
      // Get action distribution
      const [actionDistribution] = await pool.execute(
        'SELECT action, COUNT(*) as count FROM interaction_logs WHERE userId = ? GROUP BY action',
        [userId]
      );
      
      return {
        totalInteractions,
        lastActive,
        actionDistribution
      };
    } catch (error) {
      console.error('Error getting user activity stats:', error);
      throw error;
    }
  }
  
  /**
   * Delete logs by user id
   * @param {number} userId - User id
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteByUserId(userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM interaction_logs WHERE userId = ?',
        [userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting logs by user id:', error);
      throw error;
    }
  }
}

module.exports = InteractionLog;
