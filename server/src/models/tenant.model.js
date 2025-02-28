const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class TenantModel {
  static async create(tenantData) {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      space_id,
      start_date,
      end_date,
      rent_amount,
      security_deposit,
      notes
    } = tenantData;

    const query = `
      INSERT INTO tenants (
        tenant_id,
        first_name,
        last_name,
        email,
        phone_number,
        space_id,
        start_date,
        end_date,
        rent_amount,
        security_deposit,
        notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      first_name,
      last_name,
      email,
      phone_number,
      space_id,
      start_date,
      end_date,
      rent_amount || 0,
      security_deposit || 0,
      notes,
      'active'
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(tenantId) {
    const query = `
      SELECT t.*, s.title as space_title
      FROM tenants t
      JOIN spaces s ON t.space_id = s.space_id
      WHERE t.tenant_id = $1
    `;

    try {
      const result = await db.query(query, [tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    const query = `
      SELECT t.*, s.title as space_title
      FROM tenants t
      JOIN spaces s ON t.space_id = s.space_id
      ORDER BY t.last_name, t.first_name
    `;

    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findBySpaceId(spaceId) {
    const query = `
      SELECT t.*, s.title as space_title
      FROM tenants t
      JOIN spaces s ON t.space_id = s.space_id
      WHERE t.space_id = $1
      ORDER BY t.last_name, t.first_name
    `;

    try {
      const result = await db.query(query, [spaceId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findByHostId(hostId) {
    const query = `
      SELECT t.*, s.title as space_title
      FROM tenants t
      JOIN spaces s ON t.space_id = s.space_id
      WHERE s.host_id = $1
      ORDER BY t.last_name, t.first_name
    `;

    try {
      const result = await db.query(query, [hostId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(tenantId, updateData) {
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
      UPDATE tenants
      SET ${setClauses.join(', ')}
      WHERE tenant_id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, [tenantId, ...values]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async delete(tenantId) {
    const query = `
      DELETE FROM tenants
      WHERE tenant_id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, [tenantId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TenantModel;