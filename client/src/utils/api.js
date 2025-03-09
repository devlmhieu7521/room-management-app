import axios from 'axios';

// Define base URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
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
      return Promise.reject(error);
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
  // User related endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/users/me'),
    updateProfile: (userData) => api.put('/users/me', userData),
    changePassword: (passwordData) => api.put('/users/me/password', passwordData),
  },

  // Space management endpoints
  spaces: {
    /**
     * Get all spaces with optional filters
     * @param {Object} params - Query parameters for filtering
     * @returns {Promise} - API response
     */
    getAll: (params = {}) => api.get('/spaces', { params }),

    /**
     * Get a specific space by ID
     * @param {string} id - Space ID
     * @returns {Promise} - API response with space details
     */
    getById: (id) => api.get(`/spaces/${id}`),

    /**
     * Get all spaces belonging to the current host
     * @param {boolean} includeDeleted - Whether to include deleted spaces
     * @returns {Promise} - API response with host's spaces
     */
    getMySpaces: (includeDeleted = false) => {
      return api.get('/spaces/host/my-spaces', {
        params: {
          include_deleted: includeDeleted
        }
      });
    },

    /**
     * Create a new space
     * @param {Object} spaceData - Space data to create
     * @returns {Promise} - API response with created space
     */
    create: (spaceData) => api.post('/spaces', spaceData),

    /**
     * Update an existing space
     * @param {string} id - Space ID to update
     * @param {Object} spaceData - Space data to update
     * @returns {Promise} - API response with updated space
     */
    update: (id, spaceData) => api.put(`/spaces/${id}`, spaceData),

    /**
     * Delete a space (soft delete by default)
     * @param {string} id - Space ID to delete
     * @param {boolean} softDelete - Whether to perform soft delete (default: true)
     * @returns {Promise} - API response
     */
    delete: (id, softDelete = true) => {
      return api.delete(`/spaces/${id}`, {
        data: {
          soft_delete: softDelete
        }
      });
    },

    /**
     * Restore a previously soft-deleted space
     * @param {string} id - Space ID to restore
     * @returns {Promise} - API response
     */
    restore: (id) => api.put(`/spaces/${id}/restore`),

    /**
     * Get space metrics for dashboard
     * @returns {Promise} - API response with space metrics
     */
    getMetrics: () => api.get('/spaces/host/metrics'),

    /**
     * Upload space images
     * @param {string} spaceId - Space ID
     * @param {File|FormData} imageData - Image file or FormData
     * @returns {Promise} - API response
     */
    uploadImage: (spaceId, imageData) => {
      // Create form data if not already FormData
      const formData = imageData instanceof FormData ? imageData : new FormData();
      if (!(imageData instanceof FormData)) {
        formData.append('image', imageData);
      }

      return api.post(`/spaces/${spaceId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },

    /**
     * Delete space image
     * @param {string} spaceId - Space ID
     * @param {string} imageId - Image ID
     * @returns {Promise} - API response
     */
    deleteImage: (spaceId, imageId) => api.delete(`/spaces/${spaceId}/images/${imageId}`),
  },

  // Tenant management endpoints
  tenants: {
    /**
     * Get all tenants for the current host
     * @param {Object} params - Query parameters
     * @returns {Promise} - API response with tenants list
     */
    getAll: (params = {}) => api.get('/tenants', { params }),

    /**
     * Get a specific tenant by ID
     * @param {string} id - Tenant ID
     * @returns {Promise} - API response with tenant details
     */
    getById: (id) => api.get(`/tenants/${id}`),

    /**
     * Get all tenants for a specific space
     * @param {string} spaceId - Space ID
     * @param {boolean} excludeDeleted - Whether to exclude deleted tenants
     * @returns {Promise} - API response with space tenants
     */
    getBySpace: (spaceId, excludeDeleted = true) => {
      return api.get(`/tenants/space/${spaceId}`, {
        params: { exclude_deleted: excludeDeleted }
      });
    },

    /**
     * Create a new tenant
     * @param {Object} tenantData - Tenant data to create
     * @returns {Promise} - API response with created tenant
     */
    create: (tenantData) => api.post('/tenants', tenantData),

    /**
     * Update an existing tenant
     * @param {string} id - Tenant ID to update
     * @param {Object} tenantData - Tenant data to update
     * @returns {Promise} - API response with updated tenant
     */
    update: (id, tenantData) => api.put(`/tenants/${id}`, tenantData),

    /**
     * Delete a tenant (soft delete)
     * @param {string} id - Tenant ID to delete
     * @returns {Promise} - API response
     */
    delete: (id) => api.delete(`/tenants/${id}`),

    /**
     * Restore a previously soft-deleted tenant
     * @param {string} id - Tenant ID to restore
     * @returns {Promise} - API response
     */
    restore: (id) => api.put(`/tenants/${id}/restore`),

    /**
     * Get tenant metrics
     * @returns {Promise} - API response with tenant metrics
     */
    getMetrics: () => api.get('/tenants/metrics'),

    /**
     * Get only deleted tenants
     * @returns {Promise} - API response with deleted tenants
     */
    getDeleted: () => api.get('/tenants', { params: { only_deleted: true } })
  },

  // Payments and financial management endpoints
  payments: {
    /**
     * Get all payments with optional filters
     * @param {Object} params - Query parameters
     * @returns {Promise} - API response with payments
     */
    getAll: (params = {}) => api.get('/payments', { params }),

    /**
     * Get payments for a specific tenant
     * @param {string} tenantId - Tenant ID
     * @returns {Promise} - API response with tenant payments
     */
    getByTenant: (tenantId) => api.get(`/payments/tenant/${tenantId}`),

    /**
     * Get payments for a specific space
     * @param {string} spaceId - Space ID
     * @returns {Promise} - API response with space payments
     */
    getBySpace: (spaceId) => api.get(`/payments/space/${spaceId}`),

    /**
     * Record a payment
     * @param {Object} paymentData - Payment data to record
     * @returns {Promise} - API response with recorded payment
     */
    create: (paymentData) => api.post('/payments', paymentData),

    /**
     * Update payment status
     * @param {string} id - Payment ID
     * @param {Object} statusData - Status update data
     * @returns {Promise} - API response with updated payment
     */
    updateStatus: (id, statusData) => api.put(`/payments/${id}/status`, statusData),

    /**
     * Get payment statistics
     * @returns {Promise} - API response with payment statistics
     */
    getStats: () => api.get('/payments/stats'),
  },

  // Error handling helper
  handleError: (error, fallbackMessage = 'An error occurred') => {
    console.error('API Error:', error);

    // Extract the most useful error message
    if (error.response && error.response.data && error.response.data.message) {
      return error.response.data.message;
    } else if (error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
};

export default apiService;
export { api }; // Also export the raw api for custom calls