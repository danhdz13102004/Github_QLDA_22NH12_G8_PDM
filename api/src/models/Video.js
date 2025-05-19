const { pool } = require('../config/db');

/**
 * Video model functions
 */
class Video {
  /**
   * Create a new video
   * @param {Object} videoData - Video data
   * @param {string} videoData.title - Video title
   * @param {string} videoData.description - Description (optional)
   * @param {string} videoData.filePath - File path
   * @param {number} videoData.signId - Sign id
   * @returns {Promise<Object>} - Created video object
   */
  static async create(videoData) {
    try {
      const { title, description = null, filePath, signId } = videoData;
      
      const [result] = await pool.execute(
        'INSERT INTO videos (title, description, filePath, signId) VALUES (?, ?, ?, ?)',
        [title, description, filePath, signId]
      );
      
      return {
        id: result.insertId,
        title,
        description,
        filePath,
        signId
      };
    } catch (error) {
      console.error('Error creating video:', error);
      throw error;
    }
  }
  
  /**
   * Find video by id
   * @param {number} id - Video id
   * @returns {Promise<Object|null>} - Video object or null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM videos WHERE id = ?',
        [id]
      );
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding video by id:', error);
      throw error;
    }
  }
  
  /**
   * Get videos by sign id
   * @param {number} signId - Sign id
   * @returns {Promise<Array>} - Array of video objects
   */
  static async findBySignId(signId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM videos WHERE signId = ? ORDER BY title',
        [signId]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding videos by sign id:', error);
      throw error;
    }
  }
  
  /**
   * Get all videos
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Array>} - Array of video objects
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const [rows] = await pool.execute(
        'SELECT * FROM videos ORDER BY title LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      return rows;
    } catch (error) {
      console.error('Error finding all videos:', error);
      throw error;
    }
  }
  
  /**
   * Update video data
   * @param {number} id - Video id
   * @param {Object} updateData - Data to update
   * @returns {Promise<boolean>} - Success status
   */
  static async update(id, updateData) {
    try {
      const allowedFields = ['title', 'description', 'filePath', 'signId'];
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
        `UPDATE videos SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }
  
  /**
   * Delete a video
   * @param {number} id - Video id
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM videos WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }
}

module.exports = Video;
