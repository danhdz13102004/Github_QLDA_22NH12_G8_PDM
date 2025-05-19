const { pool } = require('../config/db');

/**
 * Enrollment model functions
 */
class Enrollment {
  /**
   * Create a new enrollment
   * @param {Object} enrollmentData - Enrollment data
   * @param {number} enrollmentData.userId - User id
   * @param {number} enrollmentData.courseId - Course id
   * @returns {Promise<Object>} - Created enrollment object
   */
  static async create(enrollmentData) {
    try {
      const { userId, courseId } = enrollmentData;
      
      const [result] = await pool.execute(
        'INSERT INTO enrollments (userId, courseId) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrollmentDate = CURRENT_TIMESTAMP',
        [userId, courseId]
      );
      
      return {
        id: result.insertId,
        userId,
        courseId,
        enrollmentDate: new Date()
      };
    } catch (error) {
      console.error('Error creating enrollment:', error);
      throw error;
    }
  }
  
  /**
   * Find enrollment by user id and course id
   * @param {number} userId - User id
   * @param {number} courseId - Course id
   * @returns {Promise<Object|null>} - Enrollment object or null
   */
  static async findByUserAndCourse(userId, courseId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM enrollments WHERE userId = ? AND courseId = ?',
        [userId, courseId]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding enrollment:', error);
      throw error;
    }
  }
  
  /**
   * Get enrollments by user id
   * @param {number} userId - User id
   * @returns {Promise<Array>} - Array of enrollment objects with course details
   */
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, c.title as courseTitle, c.content as courseContent
         FROM enrollments e
         JOIN courses c ON e.courseId = c.id
         WHERE e.userId = ?
         ORDER BY e.enrollmentDate DESC`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding enrollments by user id:', error);
      throw error;
    }
  }
  
  /**
   * Get enrollments by course id
   * @param {number} courseId - Course id
   * @returns {Promise<Array>} - Array of enrollment objects with user details
   */
  static async findByCourseId(courseId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.name as userName, u.email as userEmail
         FROM enrollments e
         JOIN users u ON e.userId = u.id
         WHERE e.courseId = ?
         ORDER BY e.enrollmentDate DESC`,
        [courseId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding enrollments by course id:', error);
      throw error;
    }
  }
  
  /**
   * Delete enrollment
   * @param {number} userId - User id
   * @param {number} courseId - Course id
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(userId, courseId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM enrollments WHERE userId = ? AND courseId = ?',
        [userId, courseId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      throw error;
    }
  }
  
  /**
   * Get all enrollments
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} - Array of enrollment objects with user and course details
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const [rows] = await pool.execute(
        `SELECT e.*, u.name as userName, u.email as userEmail, c.title as courseTitle
         FROM enrollments e
         JOIN users u ON e.userId = u.id
         JOIN courses c ON e.courseId = c.id
         ORDER BY e.enrollmentDate DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding all enrollments:', error);
      throw error;
    }
  }
}

module.exports = Enrollment;
