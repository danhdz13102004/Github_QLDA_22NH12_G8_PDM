const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middlewares/auth');
const signLanguageController = require('../controllers/signLanguageController');
const signController = require('../controllers/signController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Configure storage for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|avi|mov|webm/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only video files are allowed!'));
  }
});

// Define routes
// POST route for processing sign language images
router.post('/recognize', authMiddleware, upload.single('image'), signLanguageController.recognizeSignLanguage);

// GET route for retrieving sign language dictionary
router.get('/dictionary', signLanguageController.getSignLanguageDictionary);

// GET route for getting user's interaction history
router.get('/history/:userId', authMiddleware, signLanguageController.getUserInteractionHistory);

// GET route for getting sign tutorials
router.get('/tutorials/:signId', signLanguageController.getSignTutorials);

// Sign routes
router.get('/signs', signController.getAllSigns);
router.get('/signs/:id', signController.getSignById);
router.post('/signs', authMiddleware, signController.createSign);
router.put('/signs/:id', authMiddleware, signController.updateSign);
router.delete('/signs/:id', authMiddleware, signController.deleteSign);

// Video routes
router.get('/videos/:id', signController.getVideoById);
router.post('/videos', authMiddleware, videoUpload.single('video'), signController.createVideo);
router.delete('/videos/:id', authMiddleware, signController.deleteVideo);

module.exports = router;
