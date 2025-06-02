/**
 * API configuration constants
 * This file centralizes all API endpoints for easier management
 */

// Base API URL
export const API_BASE_URL = 'http://192.168.1.14:3000';

// User related endpoints
export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/api/users/register`,
  LOGIN: `${API_BASE_URL}/api/users/login`,
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
  COURSES: `${API_BASE_URL}/api/users/courses`,
  
  // Signs related endpoints
  SIGNS: `${API_BASE_URL}/api/signs`,
  SIGNS_SEARCH: `${API_BASE_URL}/api/signs/search`,
  VIDEOS_STREAM: `${API_BASE_URL}/api/videos/stream`,
};
