const Sign = require('../models/Sign');
const Video = require('../models/Video');
const InteractionLog = require('../models/InteractionLog');

/**
 * Generate a random quiz of ASL signs with videos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRandomQuiz = async (req, res) => {  
  try {
    // Get all signs that have videos
    const allSigns = await Sign.findAll({ limit: 100, offset: 0 });
    
    if (!allSigns || allSigns.length < 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Not enough signs in the database to create a quiz'
      });
    }
    
    // Filter signs to only include those with videos
    const signsWithVideos = [];
    
    for (const sign of allSigns) {
      const videos = await Sign.getVideos(sign.id);
      if (videos && videos.length > 0) {
        // Add video information to the sign
        sign.videos = videos;
        signsWithVideos.push(sign);
      }
    }
    
    if (signsWithVideos.length < 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Not enough signs with videos in the database to create a quiz'
      });
    }
    
    console.log(`Total signs with videos available: ${signsWithVideos.length}`);
    
    // Create 10 random questions
    const questions = [];
    const usedSignIds = new Set();
      // Shuffle the array of signs
    const shuffledSigns = [...signsWithVideos].sort(() => 0.5 - Math.random());
    
    // Create 10 questions (or less if we don't have enough signs)
    const questionCount = Math.min(10, Math.floor(shuffledSigns.length / 4));
    
    for (let i = 0; i < questionCount; i++) {
      // Get a correct answer (that hasn't been used as a correct answer yet)
      let correctSign;
      do {
        correctSign = shuffledSigns[Math.floor(Math.random() * shuffledSigns.length)];
      } while (usedSignIds.has(correctSign.id));
      
      usedSignIds.add(correctSign.id);
      
      // Choose a random video for this sign
      const randomVideoIndex = Math.floor(Math.random() * correctSign.videos.length);
      const selectedVideo = correctSign.videos[randomVideoIndex];
      
      // Get 3 random incorrect signs for this question
      const incorrectSigns = shuffledSigns
        .filter(sign => sign.id !== correctSign.id && !usedSignIds.has(sign.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      // If we couldn't get 3 distinct incorrect signs, we don't have enough signs
      if (incorrectSigns.length < 3) {
        continue;
      }
      
      // Create answer options with one correct and three incorrect options
      const options = [
        { id: correctSign.id, gestureName: correctSign.gestureName, isCorrect: true },
        ...incorrectSigns.map(sign => ({ 
          id: sign.id, 
          gestureName: sign.gestureName,
          isCorrect: false 
        }))
      ];
      
      // Shuffle the options
      options.sort(() => 0.5 - Math.random());
        questions.push({
        questionId: i + 1,
        video: {
          id: selectedVideo.id,
          title: selectedVideo.title,
          filePath: selectedVideo.filePath
        },
        sign: {
          id: correctSign.id,
          gestureName: correctSign.gestureName,
          description: correctSign.description
        },
        options: options.map((option, index) => ({
          id: option.id,
          gestureName: option.gestureName,
          optionIndex: index
        })),
        correctOptionIndex: options.findIndex(option => option.isCorrect)
      });}
    
    // Log this interaction
    if (req.user) {
      await InteractionLog.create({
        userId: req.user.id,
        action: 'Started a practice quiz'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        quizId: Date.now().toString(),
        questions
      }
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate quiz'
    });
  }
};

/**
 * Submit quiz answers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitQuizAnswers = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a quizId and an array of answers'
      });
    }
    
    // Calculate the score
    const correctAnswers = answers.filter(answer => answer.isCorrect);
    const score = {
      total: answers.length,
      correct: correctAnswers.length,
      percentage: Math.round((correctAnswers.length / answers.length) * 100)
    };
    
    // Log the quiz result
    if (req.user) {
      await InteractionLog.create({
        userId: req.user.id,
        action: `Completed practice quiz with score: ${score.correct}/${score.total} (${score.percentage}%)`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        quizId,
        score,
        answers
      }
    });
  } catch (error) {
    console.error('Error submitting quiz answers:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to submit quiz answers'
    });
  }
};

/**
 * Get user's quiz history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserQuizHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user permissions
    if (req.user && req.user.id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this user\'s quiz history'
      });
    }
    
    // Get quiz-related interaction logs
    const logs = await InteractionLog.findByUserId(userId);
    const quizLogs = logs.filter(log => 
      log.action.includes('practice quiz') || 
      log.action.includes('Started a practice quiz')
    );
    
    res.status(200).json({
      status: 'success',
      data: quizLogs
    });
  } catch (error) {
    console.error('Error fetching user quiz history:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch quiz history'
    });
  }
};

module.exports = {
  getRandomQuiz,
  submitQuizAnswers,
  getUserQuizHistory
};
