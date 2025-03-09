// server/src/models/location.model.js
const db = require('../config/database');

class LocationModel {
  /**
   * Get all provinces/cities from the database
   * @returns {Promise<Array>} List of provinces
   */
  static async getAllProvinces() {
    const query = `
      SELECT * FROM vn_provinces
      WHERE is_active = TRUE
      ORDER BY name
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }
  }

  /**
   * Get all districts for a specific province
   * @param {string} provinceCode Province code
   * @returns {Promise<Array>} List of districts
   */
  static async getDistrictsByProvince(provinceCode) {
    const query = `
      SELECT * FROM vn_districts
      WHERE province_code = $1 AND is_active = TRUE
      ORDER BY name
    `;

    try {
      const result = await db.query(query, [provinceCode]);
      return result.rows;
    } catch (error) {
      console.error(`Error fetching districts for province ${provinceCode}:`, error);
      throw error;
    }
  }

  /**
   * Get all wards for a specific district
   * @param {string} districtCode District code
   * @returns {Promise<Array>} List of wards
   */
  static async getWardsByDistrict(districtCode) {
    const query = `
      SELECT * FROM vn_wards
      WHERE district_code = $1 AND is_active = TRUE
      ORDER BY name
    `;

    try {
      const result = await db.query(query, [districtCode]);
      return result.rows;
    } catch (error) {
      console.error(`Error fetching wards for district ${districtCode}:`, error);
      throw error;
    }
  }

  /**
   * Get details of a specific province
   * @param {string} provinceCode Province code
   * @returns {Promise<Object>} Province details
   */
  static async getProvinceByCode(provinceCode) {
    const query = `
      SELECT * FROM vn_provinces
      WHERE code = $1 AND is_active = TRUE
    `;

    try {
      const result = await db.query(query, [provinceCode]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error fetching province ${provinceCode}:`, error);
      throw error;
    }
  }

  /**
   * Get details of a specific district
   * @param {string} districtCode District code
   * @returns {Promise<Object>} District details
   */
  static async getDistrictByCode(districtCode) {
    const query = `
      SELECT d.*, p.name as province_name
      FROM vn_districts d
      JOIN vn_provinces p ON d.province_code = p.code
      WHERE d.code = $1 AND d.is_active = TRUE
    `;

    try {
      const result = await db.query(query, [districtCode]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error fetching district ${districtCode}:`, error);
      throw error;
    }
  }

  /**
   * Get details of a specific ward
   * @param {string} wardCode Ward code
   * @returns {Promise<Object>} Ward details
   */
  static async getWardByCode(wardCode) {
    const query = `
      SELECT w.*, d.name as district_name, p.name as province_name
      FROM vn_wards w
      JOIN vn_districts d ON w.district_code = d.code
      JOIN vn_provinces p ON d.province_code = p.code
      WHERE w.code = $1 AND w.is_active = TRUE
    `;

    try {
      const result = await db.query(query, [wardCode]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error fetching ward ${wardCode}:`, error);
      throw error;
    }
  }

  /**
   * Search for locations by name
   * @param {string} searchTerm Search term
   * @param {string} type Type of location (province, district, ward)
   * @returns {Promise<Array>} Search results
   */
  static async searchLocation(searchTerm, type = 'province') {
    let query;

    switch (type) {
      case 'province':
        query = `
          SELECT * FROM vn_provinces
          WHERE name ILIKE $1 AND is_active = TRUE
          ORDER BY name
          LIMIT 10
        `;
        break;

      case 'district':
        query = `
          SELECT d.*, p.name as province_name
          FROM vn_districts d
          JOIN vn_provinces p ON d.province_code = p.code
          WHERE d.name ILIKE $1 AND d.is_active = TRUE
          ORDER BY d.name
          LIMIT 10
        `;
        break;

      case 'ward':
        query = `
          SELECT w.*, d.name as district_name, p.name as province_name
          FROM vn_wards w
          JOIN vn_districts d ON w.district_code = d.code
          JOIN vn_provinces p ON d.province_code = p.code
          WHERE w.name ILIKE $1 AND w.is_active = TRUE
          ORDER BY w.name
          LIMIT 10
        `;
        break;

      default:
        throw new Error(`Unsupported location type: ${type}`);
    }

    try {
      const result = await db.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error(`Error searching for ${type} with term ${searchTerm}:`, error);
      throw error;
    }
  }
}

module.exports = LocationModel;