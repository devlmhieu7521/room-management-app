import axios from 'axios';

// Define base URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle authentication errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // If we get an unauthorized error, clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Enhance error message
    if (error.response && error.response.data) {
      error.message = error.response.data.message || error.message;
    }

    return Promise.reject(error);
  }
);

// Helper functions for common API operations
const apiService = {
  // User related
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/users/me'),
    updateProfile: (userData) => api.put('/users/me', userData),
    changePassword: (passwordData) => api.put('/users/me/password', passwordData),
  },

  // Space related
  spaces: {
    getAll: (params) => api.get('/spaces', { params }),
    getById: (id) => api.get(`/spaces/${id}`),
    getMySpaces: () => api.get('/spaces/host/my-spaces'),
    create: (spaceData) => api.post('/spaces', spaceData),
    update: (id, spaceData) => api.put(`/spaces/${id}`, spaceData),
    delete: (id) => api.delete(`/spaces/${id}`),
    getMetrics: () => api.get('/spaces/host/metrics'),
  },

  // Booking related
  bookings: {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    getHostBookings: () => api.get('/bookings/host'),
    create: (bookingData) => api.post('/bookings', bookingData),
    updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { booking_status: status }),
  },

  // Tenant related
  tenants: {
    getAll: () => api.get('/tenants'),
    getById: (id) => api.get(`/tenants/${id}`),
    getBySpace: (spaceId) => api.get(`/tenants/space/${spaceId}`),
    create: (tenantData) => api.post('/tenants', tenantData),
    update: (id, tenantData) => api.put(`/tenants/${id}`, tenantData),
    delete: (id) => api.delete(`/tenants/${id}`),
  },
};

export default apiService;
export { api }; // Also export the raw api for custom calls