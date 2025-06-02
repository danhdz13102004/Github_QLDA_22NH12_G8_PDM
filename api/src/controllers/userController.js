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
    
    // Check if password meets minimum requirements (at least 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Encode password using base64
    const encodedPassword = Buffer.from(password).toString('base64');
    
    // Create new user with encoded password
    const newUser = await User.create({
      name,
      email,
      password: encodedPassword,
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
      // Encode the provided password and compare with stored encoded password
    const encodedPassword = Buffer.from(password).toString('base64');
    const isPasswordValid = encodedPassword === user.password;
    
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

/**
 * Update user profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, phone } = req.body;
    
    // Verify user permissions (ensure the user can only update their own profile)
    if (req.user && req.user.id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this profile'
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
    
    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already in use'
        });
      }
    }
    
    // Update user data
    const updatedUser = await User.update(userId, {
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone
    });
    
    // Log the update action
    await InteractionLog.create({
      userId: userId,
      action: 'Updated profile'
    });
    console.log('User profile updated:', updatedUser);
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update profile'
    });
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    
    // Verify user permissions (ensure the user can only change their own password)
    // if (req.user && req.user.id.toString() !== userId && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     status: 'error',
    //     message: 'Not authorized to change this password'
    //   });
    // }
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current password and new password'
      });
    }
    
    // Check if new password meets minimum requirements
    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters long'
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
    
    // Verify current password
    const encodedCurrentPassword = Buffer.from(currentPassword).toString('base64');
    console.log('user:', user);
    console.log('Encoded current password:', encodedCurrentPassword);
    console.log('Stored password:', user.password);
    if (encodedCurrentPassword !== user.password) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }
    
    // Encode and update the new password
    const encodedNewPassword = Buffer.from(newPassword).toString('base64');
    await User.update(userId, { password: encodedNewPassword });
    console.log('Password changed successfully for user:', userId);
    // Log the password change action
    await InteractionLog.create({
      userId: userId,
      action: 'Changed password'
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to change password'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllCourses,
  enrollInCourse
};
