import { API_BASE_URL } from '../constants/ApiConfig';

class ApiService {
  static async fetchSigns() {
    try {
      const url = `${API_BASE_URL}/api/signs`
      console.log('Fetching signs from: ', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching signs:', error);
      throw error;
    }
  }

  static async fetchSignById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/signs/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sign by ID:', error);
      throw error;
    }
  }

  static async searchSigns(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/signs/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching signs:', error);
      throw error;
    }
  }

  static getVideoStreamUrl(videoId) {
    return `${API_BASE_URL}/api/videos/stream/${videoId}`;
  }
}

export default ApiService;
