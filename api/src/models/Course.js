const { pool } = require('../config/db');

/**
 * Course model functions
 */
class Course {
  /**
   * Create a new course
   * @param {Object} courseData - Course data
   * @param {string} courseData.title - Course title
   * @param {string} courseData.content - Course content (JSON or text, optional)
   * @returns {Promise<Object>} - Created course object
   */
  static async create(courseData) {
    try {
      const { title, content = null } = courseData;
      
      const [result] = await pool.execute(
        'INSERT INTO courses (title, content) VALUES (?, ?)',
        [title, content]
      );
      
      return {
        id: result.insertId,
        title,
        content
      };
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }
  
  /**
   * Find course by id
   * @param {number} id - Course id
   * @returns {Promise<Object|null>} - Course object or null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM courses WHERE id = ?',
        [id]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding course by id:', error);
      throw error;
    }
  }
  
  /**
   * Get all courses
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} - Array of course objects
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const [rows] = await pool.execute(
        'SELECT * FROM courses ORDER BY title LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding all courses:', error);
      throw error;
    }
  }
  
  /**
   * Update course data
   * @param {number} id - Course id
   * @param {Object} updateData - Data to update
   * @returns {Promise<boolean>} - Success status
   */
  static async update(id, updateData) {
    try {
      const allowedFields = ['title', 'content'];
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
        `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }
  
  /**
   * Delete a course
   * @param {number} id - Course id
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM courses WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }
  
  /**
   * Get enrolled users for a course
   * @param {number} courseId - Course id
   * @returns {Promise<Array>} - Array of user objects with enrollment dates
   */
  static async getEnrolledUsers(courseId) {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.name, u.email, u.role, e.enrollmentDate
         FROM users u
         JOIN enrollments e ON u.id = e.userId
         WHERE e.courseId = ?
         ORDER BY e.enrollmentDate DESC`,
        [courseId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting enrolled users:', error);
      throw error;
    }
  }
  
  /**
   * Get signs for a course
   * @param {number} courseId - Course id
   * @returns {Promise<Array>} - Array of sign objects
   */
  static async getSigns(courseId) {
    try {
      const [rows] = await pool.execute(
        `SELECT s.*
         FROM signs s
         JOIN course_sign cs ON s.id = cs.signId
         WHERE cs.courseId = ?
         ORDER BY s.gestureName`,
        [courseId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error getting signs for course:', error);
      throw error;
    }
  }
  
  /**
   * Add a sign to a course
   * @param {number} courseId - Course id
   * @param {number} signId - Sign id
   * @returns {Promise<boolean>} - Success status
   */
  static async addSign(courseId, signId) {
    try {
      await pool.execute(
        'INSERT INTO course_sign (courseId, signId) VALUES (?, ?) ON DUPLICATE KEY UPDATE courseId = courseId',
        [courseId, signId]
      );
      
      return true;
    } catch (error) {
      console.error('Error adding sign to course:', error);
      throw error;
    }
  }
  
  /**
   * Remove a sign from a course
   * @param {number} courseId - Course id
   * @param {number} signId - Sign id
   * @returns {Promise<boolean>} - Success status
   */
  static async removeSign(courseId, signId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM course_sign WHERE courseId = ? AND signId = ?',
        [courseId, signId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removing sign from course:', error);
      throw error;
    }
  }
}

module.exports = Course;
