const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middlewares/auth');
const userController = require('../controllers/userController');

// Register new user
router.post('/register', userController.registerUser);

// Login user
router.post('/login', userController.loginUser);

// Get user profile
router.get('/profile/:id', authMiddleware, userController.getUserProfile);

module.exports = router;
