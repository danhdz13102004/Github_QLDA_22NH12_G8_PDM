const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// Stream video by ID
router.get('/stream/:id', videoController.streamVideo);

module.exports = router;
