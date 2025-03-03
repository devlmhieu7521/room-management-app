const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class SpaceModel {
  static async create(spaceData) {
    const {
      host_id,
      title,
      description,
      space_type,
      capacity,
      street_address,
      city,
      state,
      zip_code,
      country
    } = spaceData;

    const query = `
      INSERT INTO spaces (
        space_id,
        host_id,
        title,
        description,
        space_type,
        capacity,
        street_address,
        city,
        state,
        zip_code,
        country
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      host_id,
      title,
      description,
      space_type,
      capacity,
      street_address,
      city,
      state,
      zip_code,
      country
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(spaceId) {
    // Enhanced query with tenant count
    const query = `
      SELECT s.*,
             (SELECT COUNT(*) FROM tenants WHERE space_id = s.space_id AND status = 'active') AS tenant_count
      FROM spaces s
      WHERE s.space_id = $1
    `;

    try {
      const result = await db.query(query, [spaceId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByHostId(hostId) {
    // Modified query to ensure tenant_count is always returned
    const query = `
      SELECT
        s.*,
        COALESCE(
          (SELECT COUNT(*) FROM tenants WHERE space_id = s.space_id AND status = 'active'),
          0
        ) AS tenant_count
      FROM spaces s
      WHERE s.host_id = $1 AND s.is_deleted = FALSE
      ORDER BY s.created_at DESC
    `;

    try {
      const result = await db.query(query, [hostId]);
      return result.rows;
    } catch (error) {
      console.error('Error in findByHostId:', error);
      throw error;
    }
  }

  static async findAll(filters = {}) {
    // Start building the query
    let query = `
    SELECT s.*,
           (SELECT COUNT(*) FROM tenants WHERE space_id = s.space_id AND status = 'active') AS tenant_count
    FROM spaces s
    WHERE s.is_active = TRUE AND s.is_deleted = FALSE`;

    const values = [];

    // Add filters if provided
    if (filters.space_type) {
      values.push(filters.space_type);
      query += ` AND s.space_type = $${values.length}`;
    }

    if (filters.city) {
      values.push(filters.city);
      query += ` AND s.city = $${values.length}`;
    }

    if (filters.capacity) {
      values.push(filters.capacity);
      query += ` AND s.capacity >= $${values.length}`;
    }

    // Optional host_id filter
    if (filters.host_id) {
      values.push(filters.host_id);
      query += ` AND s.host_id = $${values.length}`;
    }

    query += ' ORDER BY s.created_at DESC';

    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(spaceId, updateData) {
    // Construct dynamic update query
    const keys = Object.keys(updateData);
    const values = Object.values(updateData);

    // Don't update if no data provided
    if (keys.length === 0) return null;

    // Construct SET part of query
    const setClauses = keys.map((key, index) => `${key} = $${index + 2}`);

    // Add updated_at timestamp
    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE spaces
      SET ${setClauses.join(', ')}
      WHERE space_id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, [spaceId, ...values]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async delete(spaceId) {
    // Soft delete implementation
    const query = `
      UPDATE spaces
      SET
        is_deleted = TRUE,
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE space_id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, [spaceId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error soft deleting space:', error);
      throw error;
    }
  }
  static async getMetrics(hostId) {
    const query = `
      SELECT
        COUNT(*) AS total_spaces,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS active_spaces,
        (SELECT COUNT(*) FROM tenants t JOIN spaces s ON t.space_id = s.space_id
         WHERE s.host_id = $1 AND t.status = 'active') AS total_tenants,
        (SELECT COALESCE(SUM(rent_amount), 0) FROM tenants t JOIN spaces s ON t.space_id = s.space_id
         WHERE s.host_id = $1 AND t.status = 'active') AS monthly_revenue
      FROM spaces
      WHERE host_id = $1
    `;

    console.log('Running metrics query for host ID:', hostId);

    try {
      const result = await db.query(query, [hostId]);
      console.log('Metrics query result:', result.rows[0]);
      return result.rows[0] || {
        total_spaces: 0,
        active_spaces: 0,
        total_tenants: 0,
        monthly_revenue: 0
      };
    } catch (error) {
      console.error('Metrics query error:', error);
      throw error;
    }
  }
}

module.exports = SpaceModel;