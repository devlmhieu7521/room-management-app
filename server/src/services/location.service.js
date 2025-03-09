// server/src/services/location.service.js
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache ttl: 1 day (in seconds)
const locationCache = new NodeCache({ stdTTL: 86400 });

class LocationService {
  constructor() {
    // Base URL for Vietnamese administrative divisions API
    this.apiUrl = 'https://provinces.open-api.vn/api';

    // Cache keys
    this.PROVINCES_CACHE_KEY = 'vietnam_provinces';
    this.DISTRICT_CACHE_PREFIX = 'vietnam_districts_';
    this.WARD_CACHE_PREFIX = 'vietnam_wards_';
  }

  /**
   * Get all Vietnamese provinces/cities
   * @returns {Promise<Array>} - List of provinces/cities
   */
  async getProvinces() {
    try {
      // Check cache first
      const cachedProvinces = locationCache.get(this.PROVINCES_CACHE_KEY);
      if (cachedProvinces) {
        return cachedProvinces;
      }

      // Fetch from API if not in cache
      const response = await axios.get(`${this.apiUrl}/p/`);

      if (response.data && Array.isArray(response.data)) {
        // Store in cache
        locationCache.set(this.PROVINCES_CACHE_KEY, response.data);
        return response.data;
      }

      throw new Error('Invalid province data format');
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }
  }

  /**
   * Get districts for a specific province
   * @param {number|string} provinceCode - The province code
   * @returns {Promise<Array>} - List of districts in the province
   */
  async getDistricts(provinceCode) {
    try {
      // Check cache first
      const cacheKey = `${this.DISTRICT_CACHE_PREFIX}${provinceCode}`;
      const cachedDistricts = locationCache.get(cacheKey);

      if (cachedDistricts) {
        return cachedDistricts;
      }

      // Fetch from API if not in cache
      const response = await axios.get(`${this.apiUrl}/p/${provinceCode}?depth=2`);

      if (response.data && response.data.districts && Array.isArray(response.data.districts)) {
        // Store in cache
        locationCache.set(cacheKey, response.data.districts);
        return response.data.districts;
      }

      throw new Error('Invalid district data format');
    } catch (error) {
      console.error(`Error fetching districts for province ${provinceCode}:`, error);
      throw error;
    }
  }

  /**
   * Get wards for a specific district
   * @param {number|string} districtCode - The district code
   * @returns {Promise<Array>} - List of wards in the district
   */
  async getWards(districtCode) {
    try {
      // Check cache first
      const cacheKey = `${this.WARD_CACHE_PREFIX}${districtCode}`;
      const cachedWards = locationCache.get(cacheKey);

      if (cachedWards) {
        return cachedWards;
      }

      // Fetch from API if not in cache
      const response = await axios.get(`${this.apiUrl}/d/${districtCode}?depth=2`);

      if (response.data && response.data.wards && Array.isArray(response.data.wards)) {
        // Store in cache
        locationCache.set(cacheKey, response.data.wards);
        return response.data.wards;
      }

      throw new Error('Invalid ward data format');
    } catch (error) {
      console.error(`Error fetching wards for district ${districtCode}:`, error);
      throw error;
    }
  }

  /**
   * Format a Vietnamese address from components
   * @param {Object} addressComponents - Address components
   * @returns {string} - Formatted address string
   */
  formatVietnameseAddress(addressComponents) {
    const {
      streetAddress,
      ward,
      district,
      province
    } = addressComponents;

    const components = [];

    if (streetAddress) components.push(streetAddress);
    if (ward) components.push(typeof ward === 'object' ? ward.name : ward);
    if (district) components.push(typeof district === 'object' ? district.name : district);
    if (province) components.push(typeof province === 'object' ? province.name : province);
    components.push('Vietnam');

    return components.join(', ');
  }

  /**
   * Search for location by name
   * @param {string} query - Search query
   * @param {string} type - Type of location to search (province, district, or ward)
   * @returns {Promise<Array>} - Search results
   */
  async searchLocation(query, type = 'province') {
    try {
      query = query.toLowerCase().trim();

      switch (type) {
        case 'province': {
          const provinces = await this.getProvinces();
          return provinces.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.code.toString().includes(query)
          );
        }

        case 'district': {
          // Get all provinces to search across all districts
          const provinces = await this.getProvinces();
          const results = [];

          // This is less efficient but provides a complete search
          for (const province of provinces) {
            try {
              const districts = await this.getDistricts(province.code);
              const matches = districts.filter(d =>
                d.name.toLowerCase().includes(query) ||
                d.code.toString().includes(query)
              );

              // Add province info to each matching district
              matches.forEach(district => {
                results.push({
                  ...district,
                  province
                });
              });
            } catch (err) {
              console.error(`Error searching districts in province ${province.code}:`, err);
            }
          }

          return results;
        }

        case 'ward': {
          // This is much less efficient - would need pagination in production
          const provinces = await this.getProvinces();
          const results = [];

          for (const province of provinces) {
            try {
              const districts = await this.getDistricts(province.code);

              for (const district of districts) {
                try {
                  const wards = await this.getWards(district.code);
                  const matches = wards.filter(w =>
                    w.name.toLowerCase().includes(query) ||
                    w.code.toString().includes(query)
                  );

                  // Add district and province info to each matching ward
                  matches.forEach(ward => {
                    results.push({
                      ...ward,
                      district,
                      province
                    });
                  });
                } catch (err) {
                  console.error(`Error searching wards in district ${district.code}:`, err);
                }
              }
            } catch (err) {
              console.error(`Error searching districts in province ${province.code}:`, err);
            }
          }

          return results;
        }

        default:
          throw new Error(`Unsupported location type: ${type}`);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }
}

module.exports = new LocationService();