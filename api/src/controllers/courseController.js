const Course = require('../models/Course');
const Sign = require('../models/Sign');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const InteractionLog = require('../models/InteractionLog');

/**
 * Get all courses 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    
    res.status(200).json({
      status: 'success',
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch courses'
    });
  }
};

/**
 * Get course by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }
    
    // Get signs for this course
    const signs = await Course.getSigns(courseId);
    
    res.status(200).json({
      status: 'success',
      data: {
        ...course,
        signs
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch course'
    });
  }
};

/**
 * Create a new course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createCourse = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can create courses'
      });
    }
    
    const { title, content } = req.body;
    
    // Validate input
    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a title for the course'
      });
    }
    
    // Create course
    const newCourse = await Course.create({
      title,
      content: content || null
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: newCourse
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create course'
    });
  }
};

/**
 * Update a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCourse = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can update courses'
      });
    }
    
    const courseId = req.params.id;
    const { title, content } = req.body;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }
    
    // Update course
    const updateData = {};
    if (title) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    
    const updated = await Course.update(courseId, updateData);
    
    if (!updated) {
      return res.status(400).json({
        status: 'error',
        message: 'No changes made to the course'
      });
    }
    
    // Get updated course
    const updatedCourse = await Course.findById(courseId);
    
    res.status(200).json({
      status: 'success',
      message: 'Course updated successfully',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update course'
    });
  }
};

/**
 * Delete a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteCourse = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can delete courses'
      });
    }
    
    const courseId = req.params.id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }
    
    // Delete course
    const deleted = await Course.delete(courseId);
    
    if (!deleted) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete course'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete course'
    });
  }
};

/**
 * Add a sign to a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addSignToCourse = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can add signs to courses'
      });
    }
    
    const { courseId, signId } = req.body;
    
    // Validate input
    if (!courseId || !signId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide courseId and signId'
      });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }
    
    // Check if sign exists
    const sign = await Sign.findById(signId);
    if (!sign) {
      return res.status(404).json({
        status: 'error',
        message: 'Sign not found'
      });
    }
    
    // Add sign to course
    await Course.addSign(courseId, signId);
    
    res.status(200).json({
      status: 'success',
      message: `Sign "${sign.gestureName}" added to course "${course.title}" successfully`
    });
  } catch (error) {
    console.error('Error adding sign to course:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to add sign to course'
    });
  }
};

/**
 * Remove a sign from a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeSignFromCourse = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can remove signs from courses'
      });
    }
    
    const { courseId, signId } = req.params;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }
    
    // Check if sign exists
    const sign = await Sign.findById(signId);
    if (!sign) {
      return res.status(404).json({
        status: 'error',
        message: 'Sign not found'
      });
    }
    
    // Remove sign from course
    const removed = await Course.removeSign(courseId, signId);
    
    if (!removed) {
      return res.status(400).json({
        status: 'error',
        message: 'Sign is not associated with this course'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: `Sign "${sign.gestureName}" removed from course "${course.title}" successfully`
    });
  } catch (error) {
    console.error('Error removing sign from course:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to remove sign from course'
    });
  }
};

/**
 * Get course enrollment data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCourseEnrollments = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }
    
    // Get enrolled users
    const enrolledUsers = await Course.getEnrolledUsers(courseId);
    
    res.status(200).json({
      status: 'success',
      data: enrolledUsers
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch course enrollments'
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addSignToCourse,
  removeSignFromCourse,
  getCourseEnrollments
};
