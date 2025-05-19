const User = require('../models/User');
const InteractionLog = require('../models/InteractionLog');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email and password'
      });
    }
    
    // In a real app, you would hash the password before storing
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const newUser = await User.create({
      name,
      email,
      password, // Use hashedPassword in real app
      role: 'user'
    });
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to register user'
    });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // Get user from database
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // In a real app, you would verify the password hash
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = password === user.password; // Unsafe, for demo only
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // In a real app, generate a JWT token
    // const token = jwt.sign(
    //   { id: user.id, email: user.email, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRES_IN }
    // );
    const token = 'mock_jwt_token'; // For demo only
    
    // Log the login action
    await InteractionLog.create({
      userId: user.id,
      action: 'Logged in'
    });
    
    res.status(200).json({
      status: 'success',
      message: 'User logged in successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to login'
    });
  }
};

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verify user permissions (in real app, ensure the user can only access their own profile)
    if (req.user && req.user.id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this profile'
      });
    }
    
    // Get user from database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Get user statistics
    const activityStats = await InteractionLog.getUserActivityStats(userId);
    
    // Get user's enrolled courses
    const enrolledCourses = await User.getUserCourses(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        ...user,
        statistics: {
          totalInteractions: activityStats.totalInteractions,
          lastActive: activityStats.lastActive,
          actionDistribution: activityStats.actionDistribution
        },
        enrolledCourses
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch user profile'
    });
  }
};

/**
 * Get all courses available for enrollment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    
    res.status(200).json({
      status: 'success',
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch courses'
    });
  }
};

/**
 * Enroll user in a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const enrollInCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    
    // Validate input
    if (!userId || !courseId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide userId and courseId'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found'
      });
    }
    
    // Create enrollment
    const enrollment = await Enrollment.create({
      userId,
      courseId
    });
    
    // Log the action
    await InteractionLog.create({
      userId,
      action: `Enrolled in course: ${course.title}`
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to enroll in course'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getAllCourses,
  enrollInCourse
};
