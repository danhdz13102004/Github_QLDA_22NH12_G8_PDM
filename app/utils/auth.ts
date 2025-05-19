import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.10:3000/api'; // Replace with your API URL

// Types for auth responses
export interface ApiResponse<T = any> {
  success: boolean;
  data: {
    status: string;
    message: string;
    data?: T;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  token?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * Register a new user
 */
export const registerUser = async (userData: RegisterData): Promise<ApiResponse<User>> => {
  try {
    const response = await fetch(`${API_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    return {
      success: response.ok,
      data,
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      data: {
        status: 'error',
        message: 'Network error. Please try again later.',
      },
    };
  }
};

/**
 * Login a user
 */
export const loginUser = async (userData: LoginData): Promise<ApiResponse<User>> => {
  try {
    const response = await fetch(`${API_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    return {
      success: response.ok,
      data,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      data: {
        status: 'error',
        message: 'Network error. Please try again later.',
      },
    };
  }
};

/**
 * Store authentication token
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('@auth_token', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

/**
 * Get authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('@auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Remove authentication token (logout)
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};
