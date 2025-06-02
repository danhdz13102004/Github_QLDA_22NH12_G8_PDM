const express = require('express');
const router = express.Router();
const signController = require('../controllers/signController');

// Search signs by query (must come before /:id route)
router.get('/search', signController.searchSigns);

// Retrieve all signs
router.get('/', signController.getAllSigns);

// Retrieve a specific sign by ID
router.get('/:id', signController.getSignById);

module.exports = router;
