const { pool } = require('../config/db');

/**
 * SignLanguageLog model functions
 */
class SignLanguageLog {
  /**
   * Create a new sign language recognition log
   * @param {Object} logData - Log data
   * @param {number|null} logData.userId - User id (optional)
   * @param {string} logData.gestureInput - Gesture input (image path)
   * @param {string} logData.recognizedText - Recognized text
   * @param {number} logData.confidence - Recognition confidence
   * @returns {Promise<Object>} - Created log object
   */
  static async create(logData) {
    try {
      const { userId, gestureInput, recognizedText, confidence } = logData;
      
      const [result] = await pool.execute(
        'INSERT INTO sign_language_logs (user_id, gesture_input, recognized_text, confidence) VALUES (?, ?, ?, ?)',
        [userId, gestureInput, recognizedText, confidence]
      );
      
      return {
        id: result.insertId,
        userId,
        gestureInput,
        recognizedText,
        confidence,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error creating sign language log:', error);
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
        'SELECT * FROM sign_language_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding logs by user id:', error);
      throw error;
    }
  }
  
  /**
   * Get user statistics
   * @param {number} userId - User id
   * @returns {Promise<Object>} - User statistics
   */
  static async getUserStats(userId) {
    try {
      // Get total recognitions
      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM sign_language_logs WHERE user_id = ?',
        [userId]
      );
      
      const totalRecognitions = totalResult[0].total;
      
      // Get last activity
      const [lastActivityResult] = await pool.execute(
        'SELECT MAX(timestamp) as lastActive FROM sign_language_logs WHERE user_id = ?',
        [userId]
      );
      
      const lastActive = lastActivityResult[0].lastActive;
      
      // Calculate success rate (mock value for now)
      const successRate = 0.89;
      
      return {
        totalRecognitions,
        successRate,
        lastActive
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}

module.exports = SignLanguageLog;
