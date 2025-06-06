const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeRoles } = require('../middlewares/auth');
const userController = require('../controllers/userController');
const courseController = require('../controllers/courseController');

// Register new user
router.post('/register', userController.registerUser);

// Login user
router.post('/login', userController.loginUser);

// Forgot password routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/reset-password', userController.resetPassword);

// Get user profile
router.get('/profile/:id', userController.getUserProfile);

// Update user profile information
router.put('/profile/:id', userController.updateUserProfile);

// Change user password
router.put('/profile/:id/password', userController.changePassword);

// Course routes
router.get('/courses', userController.getAllCourses);
router.post('/enroll', authMiddleware, userController.enrollInCourse);

// Admin course management
router.get('/courses/:id', courseController.getCourseById);
router.post('/courses', authMiddleware, courseController.createCourse);
router.put('/courses/:id', authMiddleware, courseController.updateCourse);
router.delete('/courses/:id', authMiddleware, courseController.deleteCourse);

// Course-Sign relationships
router.post('/courses/signs', authMiddleware, courseController.addSignToCourse);
router.delete('/courses/:courseId/signs/:signId', authMiddleware, courseController.removeSignFromCourse);

// Course enrollments
router.get('/courses/:id/enrollments', authMiddleware, courseController.getCourseEnrollments);

module.exports = router;
