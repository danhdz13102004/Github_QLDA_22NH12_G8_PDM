const Sign = require('../models/Sign');
const Video = require('../models/Video');
const InteractionLog = require('../models/InteractionLog');

/**
 * Get all signs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllSigns = async (req, res) => {
  try {
    const signs = await Sign.findAll();
    
    res.status(200).json({
      status: 'success',
      data: signs
    });
  } catch (error) {
    console.error('Error fetching signs:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch signs'
    });
  }
};

/**
 * Get sign by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSignById = async (req, res) => {
  try {
    const signId = req.params.id;
    
    const sign = await Sign.findById(signId);
    if (!sign) {
      return res.status(404).json({
        status: 'error',
        message: 'Sign not found'
      });
    }
    
    // Get videos for this sign
    const videos = await Sign.getVideos(signId);
    
    // Get courses that include this sign
    const courses = await Sign.getCourses(signId);
    
    // Log this interaction if user is authenticated
    if (req.user) {
      await InteractionLog.create({
        userId: req.user.id,
        action: `Viewed sign: ${sign.gestureName}`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        ...sign,
        videos,
        courses
      }
    });
  } catch (error) {
    console.error('Error fetching sign:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch sign'
    });
  }
};

/**
 * Create a new sign
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSign = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can create signs'
      });
    }
    
    const { gestureName, description } = req.body;
    
    // Validate input
    if (!gestureName) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a gesture name'
      });
    }
    
    // Check if sign already exists
    const existingSign = await Sign.findByGestureName(gestureName);
    if (existingSign) {
      return res.status(400).json({
        status: 'error',
        message: 'A sign with this gesture name already exists'
      });
    }
    
    // Create sign
    const newSign = await Sign.create({
      gestureName,
      description
    });
    
    // Log this action
    await InteractionLog.create({
      userId: req.user.id,
      action: `Created new sign: ${gestureName}`
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Sign created successfully',
      data: newSign
    });
  } catch (error) {
    console.error('Error creating sign:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create sign'
    });
  }
};

/**
 * Update a sign
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSign = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can update signs'
      });
    }
    
    const signId = req.params.id;
    const { gestureName, description } = req.body;
    
    // Check if sign exists
    const sign = await Sign.findById(signId);
    if (!sign) {
      return res.status(404).json({
        status: 'error',
        message: 'Sign not found'
      });
    }
    
    // If gesture name is being changed, check for duplicates
    if (gestureName && gestureName !== sign.gestureName) {
      const existingSign = await Sign.findByGestureName(gestureName);
      if (existingSign) {
        return res.status(400).json({
          status: 'error',
          message: 'A sign with this gesture name already exists'
        });
      }
    }
    
    // Update sign
    const updateData = {};
    if (gestureName) updateData.gestureName = gestureName;
    if (description !== undefined) updateData.description = description;
    
    const updated = await Sign.update(signId, updateData);
    
    if (!updated) {
      return res.status(400).json({
        status: 'error',
        message: 'No changes made to the sign'
      });
    }
    
    // Get updated sign
    const updatedSign = await Sign.findById(signId);
    
    // Log this action
    await InteractionLog.create({
      userId: req.user.id,
      action: `Updated sign: ${updatedSign.gestureName}`
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Sign updated successfully',
      data: updatedSign
    });
  } catch (error) {
    console.error('Error updating sign:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update sign'
    });
  }
};

/**
 * Delete a sign
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSign = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can delete signs'
      });
    }
    
    const signId = req.params.id;
    
    // Check if sign exists
    const sign = await Sign.findById(signId);
    if (!sign) {
      return res.status(404).json({
        status: 'error',
        message: 'Sign not found'
      });
    }
    
    // Get the sign name for logging
    const gestureName = sign.gestureName;
    
    // Delete sign
    const deleted = await Sign.delete(signId);
    
    if (!deleted) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete sign'
      });
    }
    
    // Log this action
    await InteractionLog.create({
      userId: req.user.id,
      action: `Deleted sign: ${gestureName}`
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Sign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sign:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete sign'
    });
  }
};

/**
 * Create a video for a sign
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createVideo = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can create videos'
      });
    }
    
    const { title, description, signId } = req.body;
    
    // Validate input
    if (!title || !signId || !req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide title, signId, and video file'
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
    
    // Create video
    const filePath = req.file.path;
    const newVideo = await Video.create({
      title,
      description,
      filePath,
      signId
    });
    
    // Log this action
    await InteractionLog.create({
      userId: req.user.id,
      action: `Added video "${title}" for sign: ${sign.gestureName}`
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Video created successfully',
      data: newVideo
    });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create video'
    });
  }
};

/**
 * Get video by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVideoById = async (req, res) => {
  try {
    const videoId = req.params.id;
    
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Get the sign for this video
    const sign = await Sign.findById(video.signId);
    
    // Log this interaction if user is authenticated
    if (req.user) {
      await InteractionLog.create({
        userId: req.user.id,
        action: `Viewed video: ${video.title}`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        ...video,
        sign
      }
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch video'
    });
  }
};

/**
 * Delete a video
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteVideo = async (req, res) => {
  try {
    // Check for admin permission
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can delete videos'
      });
    }
    
    const videoId = req.params.id;
    
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found'
      });
    }
    
    // Delete video file if it exists
    if (video.filePath) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.resolve(video.filePath);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete video record
    const deleted = await Video.delete(videoId);
    
    if (!deleted) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete video'
      });
    }
    
    // Log this action
    await InteractionLog.create({
      userId: req.user.id,
      action: `Deleted video: ${video.title}`
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete video'
    });
  }
};

module.exports = {
  getAllSigns,
  getSignById,
  createSign,
  updateSign,
  deleteSign,
  createVideo,
  getVideoById,
  deleteVideo
};
