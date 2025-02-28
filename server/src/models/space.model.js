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
    const query = 'SELECT * FROM spaces WHERE space_id = $1';

    try {
      const result = await db.query(query, [spaceId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByHostId(hostId) {
    const query = 'SELECT * FROM spaces WHERE host_id = $1';

    try {
      const result = await db.query(query, [hostId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM spaces WHERE is_active = TRUE';
    const values = [];

    // Add filters if provided
    if (filters.space_type) {
      values.push(filters.space_type);
      query += ` AND space_type = $${values.length}`;
    }

    if (filters.city) {
      values.push(filters.city);
      query += ` AND city = $${values.length}`;
    }

    if (filters.capacity) {
      values.push(filters.capacity);
      query += ` AND capacity >= $${values.length}`;
    }

    query += ' ORDER BY created_at DESC';

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
    // Using soft delete by setting is_active = FALSE
    const query = `
      UPDATE spaces
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE space_id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, [spaceId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SpaceModel;