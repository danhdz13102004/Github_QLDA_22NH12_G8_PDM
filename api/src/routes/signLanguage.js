const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middlewares/auth');
const signLanguageController = require('../controllers/signLanguageController');

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

// Define routes
// POST route for processing sign language images
router.post('/recognize', authMiddleware, upload.single('image'), signLanguageController.recognizeSignLanguage);

// GET route for retrieving sign language dictionary
router.get('/dictionary', signLanguageController.getSignLanguageDictionary);

// GET route for getting user's recognition history
router.get('/history/:userId', authMiddleware, signLanguageController.getUserRecognitionHistory);

module.exports = router;
