// client/src/utils/locationApi.js
import axios from 'axios';

// Define base URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

/**
 * Service for working with Vietnamese location data
 */
const locationApi = {
  /**
   * Fetch all Vietnamese provinces/cities
   * @returns {Promise<Array>} - List of provinces/cities
   */
  getProvinces: async () => {
    try {
      // First try the direct external API for faster response
      const response = await axios.get('https://provinces.open-api.vn/api/p/');
      return response.data;
    } catch (error) {
      console.warn('Falling back to server API for provinces:', error);
      // Fall back to the server API if external API fails
      const fallbackResponse = await axios.get(`${API_URL}/locations/provinces`);
      return fallbackResponse.data.data;
    }
  },

  /**
   * Fetch districts for a specific province
   * @param {number|string} provinceCode - The province code
   * @returns {Promise<Array>} - List of districts
   */
  getDistricts: async (provinceCode) => {
    try {
      // First try the direct external API
      const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      return response.data.districts;
    } catch (error) {
      console.warn(`Falling back to server API for districts in province ${provinceCode}:`, error);
      // Fall back to the server API
      const fallbackResponse = await axios.get(`${API_URL}/locations/provinces/${provinceCode}/districts`);
      return fallbackResponse.data.data;
    }
  },

  /**
   * Fetch wards for a specific district
   * @param {number|string} districtCode - The district code
   * @returns {Promise<Array>} - List of wards
   */
  getWards: async (districtCode) => {
    try {
      // First try the direct external API
      const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      return response.data.wards;
    } catch (error) {
      console.warn(`Falling back to server API for wards in district ${districtCode}:`, error);
      // Fall back to the server API
      const fallbackResponse = await axios.get(`${API_URL}/locations/districts/${districtCode}/wards`);
      return fallbackResponse.data.data;
    }
  },

  /**
   * Search for locations by name
   * @param {string} query - Search query
   * @param {string} type - Type of location to search (province, district, ward)
   * @returns {Promise<Array>} - Search results
   */
  searchLocation: async (query, type = 'province') => {
    try {
      const response = await axios.get(`${API_URL}/locations/search`, {
        params: { query, type }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  },

  /**
   * Format a Vietnamese address from components
   * @param {Object} components - Address components
   * @returns {Promise<string>} - Formatted address
   */
  formatAddress: async (components) => {
    try {
      // Try to do it client-side first
      const parts = [];
      if (components.streetAddress) parts.push(components.streetAddress);
      if (components.ward?.name) parts.push(components.ward.name);
      if (components.district?.name) parts.push(components.district.name);
      if (components.province?.name) parts.push(components.province.name);
      parts.push('Vietnam');

      return parts.join(', ');
    } catch (error) {
      console.warn('Using server-side address formatting:', error);

      // Fall back to server-side formatting
      const response = await axios.post(`${API_URL}/locations/format-address`, components);
      return response.data.data;
    }
  }
};

export default locationApi;