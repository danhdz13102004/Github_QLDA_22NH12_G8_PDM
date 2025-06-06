/**
 * API configuration constants
 * This file centralizes all API endpoints for easier management
 */

// Base API URL
export const API_BASE_URL = 'http://192.168.1.19:3000';

// User related endpoints
export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/api/users/register`,
  LOGIN: `${API_BASE_URL}/api/users/login`,
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/api/users/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/users/profile/:id/password`,
  COURSES: `${API_BASE_URL}/api/users/courses`,
  
  // Forgot password endpoints
  FORGOT_PASSWORD: `${API_BASE_URL}/api/users/forgot-password`,
  VERIFY_OTP: `${API_BASE_URL}/api/users/verify-otp`,
  RESET_PASSWORD: `${API_BASE_URL}/api/users/reset-password`,
  
  // Sign language related endpoints
  SIGNS: `${API_BASE_URL}/api/sign-language/signs`,
  SIGN_DETAIL: `${API_BASE_URL}/api/sign-language/signs/:id`,
  RECOGNIZE: `${API_BASE_URL}/api/sign-language/recognize`,
  HISTORY: `${API_BASE_URL}/api/sign-language/history/:userId`,
  
  // Quiz related endpoints
  QUIZ_RANDOM: `${API_BASE_URL}/api/quiz/random`,
  QUIZ_DEMO: `${API_BASE_URL}/api/quiz/demo`,
  QUIZ_SUBMIT: `${API_BASE_URL}/api/quiz/submit`,
  QUIZ_HISTORY: `${API_BASE_URL}/api/quiz/history/:userId`,
  
  // Signs related endpoints
  SIGNS_LIST: `${API_BASE_URL}/api/signs`,
  SIGNS_SEARCH: `${API_BASE_URL}/api/signs/search`,
  VIDEOS_STREAM: `${API_BASE_URL}/api/videos/stream`,
};
