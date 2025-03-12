// Service for managing rental spaces
import defaultSpace from '../models/spaceModel';
import authService from './authService';

// Mock data for Vietnam locations
const vietnamLocations = {
  cities: [
    'Ho Chi Minh City',
    'Hanoi',
    'Da Nang',
    'Can Tho',
    'Hai Phong',
    'Nha Trang',
    'Hue',
    'Vung Tau'
  ],
  districts: {
    'Ho Chi Minh City': [
      'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
      'District 6', 'District 7', 'District 8', 'District 9', 'District 10',
      'District 11', 'District 12', 'Binh Thanh', 'Phu Nhuan', 'Thu Duc',
      'Go Vap', 'Tan Binh'
    ],
    'Hanoi': [
      'Ba Dinh', 'Hoan Kiem', 'Hai Ba Trung', 'Dong Da', 'Cau Giay',
      'Tay Ho', 'Thanh Xuan', 'Hoang Mai', 'Long Bien', 'Ha Dong'
    ],
    'Da Nang': [
      'Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son', 'Lien Chieu',
      'Cam Le', 'Hoa Vang'
    ],
    // Add more as needed
  },
  wards: {
    // Example wards for a district in HCMC
    'District 1': [
      'Ben Nghe', 'Ben Thanh', 'Cau Kho', 'Cau Ong Lanh', 'Co Giang',
      'Da Kao', 'Nguyen Cu Trinh', 'Nguyen Thai Binh', 'Pham Ngu Lao',
      'Tan Dinh'
    ],
    // Add more as needed
  }
};

const SPACES_STORAGE_KEY = 'rental_spaces';

const spaceService = {
  // Get all available locations for dropdowns
  getLocations: () => {
    return vietnamLocations;
  },

  // Get wards based on selected district
  getWardsByDistrict: (district) => {
    return vietnamLocations.wards[district] || [];
  },

  // Get districts based on selected city
  getDistrictsByCity: (city) => {
    return vietnamLocations.districts[city] || [];
  },

  // Create a new space
  createSpace: (spaceData) => {
    return new Promise((resolve, reject) => {
      try {
        // Get current spaces from storage
        const spacesJson = localStorage.getItem(SPACES_STORAGE_KEY);
        const spaces = spacesJson ? JSON.parse(spacesJson) : [];

        // Generate ID and timestamps
        const newSpace = {
          ...defaultSpace,
          ...spaceData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: authService.getCurrentUser()?.id || 'unknown'
        };

        // Add new space and save
        spaces.push(newSpace);
        localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));

        // Simulate delay for API call
        setTimeout(() => {
          resolve(newSpace);
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get all spaces (optionally filtered by owner)
  getAllSpaces: (ownerId = null) => {
    return new Promise((resolve, reject) => {
      try {
        const spacesJson = localStorage.getItem(SPACES_STORAGE_KEY);
        let spaces = spacesJson ? JSON.parse(spacesJson) : [];

        // Filter by owner if requested
        if (ownerId) {
          spaces = spaces.filter(space => space.createdBy === ownerId);
        }

        // Simulate delay
        setTimeout(() => {
          resolve(spaces);
        }, 300);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get a single space by ID
  getSpaceById: (spaceId) => {
    return new Promise((resolve, reject) => {
      try {
        const spacesJson = localStorage.getItem(SPACES_STORAGE_KEY);
        const spaces = spacesJson ? JSON.parse(spacesJson) : [];

        const space = spaces.find(s => s.id === spaceId);

        if (space) {
          setTimeout(() => {
            resolve(space);
          }, 300);
        } else {
          reject(new Error('Space not found'));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // Update an existing space
  updateSpace: (spaceId, updatedData) => {
    return new Promise((resolve, reject) => {
      try {
        const spacesJson = localStorage.getItem(SPACES_STORAGE_KEY);
        const spaces = spacesJson ? JSON.parse(spacesJson) : [];

        const index = spaces.findIndex(s => s.id === spaceId);

        if (index !== -1) {
          // Update space data
          const updatedSpace = {
            ...spaces[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
          };

          spaces[index] = updatedSpace;
          localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));

          setTimeout(() => {
            resolve(updatedSpace);
          }, 500);
        } else {
          reject(new Error('Space not found'));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // Delete a space
  deleteSpace: (spaceId) => {
    return new Promise((resolve, reject) => {
      try {
        const spacesJson = localStorage.getItem(SPACES_STORAGE_KEY);
        const spaces = spacesJson ? JSON.parse(spacesJson) : [];

        const filteredSpaces = spaces.filter(s => s.id !== spaceId);

        if (filteredSpaces.length !== spaces.length) {
          localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(filteredSpaces));
          setTimeout(() => {
            resolve(true);
          }, 500);
        } else {
          reject(new Error('Space not found'));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // Handle image upload (for MVP, we'll convert to base64 and store locally)
  uploadImage: (file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          // In a real app, this would be an API call to store the image
          setTimeout(() => {
            resolve({
              url: reader.result,
              filename: file.name,
              size: file.size,
              type: file.type
            });
          }, 1000);
        };
        reader.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
};

export default spaceService;