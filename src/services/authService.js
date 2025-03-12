// This service will handle all authentication-related API calls
// For the MVP, we're using localStorage for demonstration purposes
// In a production environment, this would interact with a backend API

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const authService = {
  // Register a new property manager
  register: async (userData) => {
    try {
      // In a real implementation, this would be an API call
      // return await api.post(`${BASE_URL}/auth/register`, userData);

      // For MVP demo purposes, simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Return a mock successful response
      return {
        success: true,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login the property manager
  login: async (credentials) => {
    try {
      // In a real implementation, this would be an API call
      // const response = await api.post(`${BASE_URL}/auth/login`, credentials);

      // For MVP demo purposes, simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate authentication check
      if (credentials.email && credentials.password) {
        // Generate demo token and user data
        const token = 'demo-token-' + Math.random().toString(36).substring(2, 15);
        const user = {
          id: '1',
          name: 'Property Manager',
          email: credentials.email,
          role: 'host'
        };

        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        return {
          success: true,
          token,
          user
        };
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout the property manager
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return true;
  },

  // Check if the user is logged in
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Get the current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  }
};

export default authService;