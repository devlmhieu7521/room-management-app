// server/src/controllers/location.controller.js
const LocationModel = require('../models/location.model');

class LocationController {
  /**
   * Get all provinces/cities
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getProvinces(req, res) {
    try {
      const provinces = await LocationModel.getAllProvinces();

      return res.status(200).json({
        success: true,
        data: provinces
      });
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching provinces',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get districts for a specific province
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getDistricts(req, res) {
    try {
      const { provinceCode } = req.params;

      if (!provinceCode) {
        return res.status(400).json({
          success: false,
          message: 'Province code is required'
        });
      }

      const districts = await LocationModel.getDistrictsByProvince(provinceCode);

      return res.status(200).json({
        success: true,
        data: districts
      });
    } catch (error) {
      console.error(`Error fetching districts for province ${req.params.provinceCode}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching districts',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get wards for a specific district
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getWards(req, res) {
    try {
      const { districtCode } = req.params;

      if (!districtCode) {
        return res.status(400).json({
          success: false,
          message: 'District code is required'
        });
      }

      const wards = await LocationModel.getWardsByDistrict(districtCode);

      return res.status(200).json({
        success: true,
        data: wards
      });
    } catch (error) {
      console.error(`Error fetching wards for district ${req.params.districtCode}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching wards',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get location details by code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getLocationDetails(req, res) {
    try {
      const { type, code } = req.params;

      if (!type || !code) {
        return res.status(400).json({
          success: false,
          message: 'Location type and code are required'
        });
      }

      let location = null;

      switch (type) {
        case 'province':
          location = await LocationModel.getProvinceByCode(code);
          break;

        case 'district':
          location = await LocationModel.getDistrictByCode(code);
          break;

        case 'ward':
          location = await LocationModel.getWardByCode(code);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: `Invalid location type: ${type}`
          });
      }

      if (!location) {
        return res.status(404).json({
          success: false,
          message: `${type} with code ${code} not found`
        });
      }

      return res.status(200).json({
        success: true,
        data: location
      });
    } catch (error) {
      console.error(`Error fetching location details:`, error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching location details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Search for locations by name
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchLocation(req, res) {
    try {
      const { query, type = 'province' } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const results = await LocationModel.searchLocation(query, type);

      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error searching locations:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while searching locations',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = LocationController;