/**
 * API configuration constants
 * This file centralizes all API endpoints for easier management
 */

// Base API URL
export const API_BASE_URL = 'http://10.0.2.2:3000';

// User related endpoints
export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/api/users/register`,
  LOGIN: `${API_BASE_URL}/api/users/login`,
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
  COURSES: `${API_BASE_URL}/api/users/courses`,
};
