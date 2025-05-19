const path = require('path');
const fs = require('fs');
const { sendImageToAIServer } = require('../utils/aiService');
const InteractionLog = require('../models/InteractionLog');
const Sign = require('../models/Sign');
const Video = require('../models/Video');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Process sign language image for recognition
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const recognizeSignLanguage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      });
    }

    const userId = req.user ? req.user.id : null;
    const imagePath = req.file.path;

    // Send image to AI server for processing
    const aiResult = await sendImageToAIServer(imagePath);

    if (!aiResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to process image with AI server'
      });
    }

    // Store the recognition result in the database
    if (userId) {
      // Log the interaction
      await InteractionLog.create({
        userId,
        action: `Recognized sign: ${aiResult.recognizedText}`
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        recognized_text: aiResult.recognizedText,
        confidence: aiResult.confidence
      }
    });
  } catch (error) {
    console.error('Error in sign language recognition:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred during sign language recognition'
    });
  }
};

/**
 * Get all signs from the dictionary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSignLanguageDictionary = async (req, res) => {
  try {
    const signs = await Sign.findAll();
    
    res.status(200).json({
      status: 'success',
      data: signs
    });
  } catch (error) {
    console.error('Error fetching sign language dictionary:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch sign language dictionary'
    });
  }
};

/**
 * Get user interaction history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserInteractionHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user permissions (in real app, ensure the user can only access their own history)
    if (req.user && req.user.id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this user\'s history'
      });
    }
    
    const logs = await InteractionLog.findByUserId(userId);
    
    res.status(200).json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    console.error('Error fetching user interaction history:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch interaction history'
    });
  }
};

/**
 * Get tutorials for a specific sign
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSignTutorials = async (req, res) => {
  try {
    const signId = req.params.signId;
    
    // Get the sign
    const sign = await Sign.findById(signId);
    if (!sign) {
      return res.status(404).json({
        status: 'error',
        message: 'Sign not found'
      });
    }
    
    // Get tutorials (videos) for this sign
    const videos = await Video.findBySignId(signId);
    
    res.status(200).json({
      status: 'success',
      data: {
        sign,
        videos
      }
    });
  } catch (error) {
    console.error('Error fetching sign tutorials:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch sign tutorials'
    });
  }
};

module.exports = {
  recognizeSignLanguage,
  getSignLanguageDictionary,
  getUserInteractionHistory,
  getSignTutorials
};
