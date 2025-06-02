const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const quizController = require('../controllers/quizController');

// Define quiz routes
router.get('/random', authMiddleware, quizController.getRandomQuiz);
router.get('/demo', quizController.getRandomQuiz); // No auth required for demo
router.post('/submit', authMiddleware, quizController.submitQuizAnswers);
router.get('/history/:userId', authMiddleware, quizController.getUserQuizHistory);

module.exports = router;
