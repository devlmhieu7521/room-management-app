const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class BookingModel {
  static async create(bookingData) {
    const { space_id, tenant_id, start_date, end_date } = bookingData;

    const query = `
      INSERT INTO bookings (
        booking_id,
        space_id,
        tenant_id,
        start_date,
        end_date,
        booking_status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      space_id,
      tenant_id,
      start_date,
      end_date,
      'pending'
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findById(bookingId) {
    const query = `
      SELECT b.*, s.title as space_title
      FROM bookings b
      JOIN spaces s ON b.space_id = s.space_id
      WHERE b.booking_id = $1
    `;

    try {
      const result = await db.query(query, [bookingId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByUser(userId) {
    const query = `
      SELECT b.*, s.title as space_title
      FROM bookings b
      JOIN spaces s ON b.space_id = s.space_id
      WHERE b.tenant_id = $1
      ORDER BY b.start_date DESC
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async findBySpaceHost(hostId) {
    const query = `
      SELECT b.*, s.title as space_title, u.first_name, u.last_name, u.email
      FROM bookings b
      JOIN spaces s ON b.space_id = s.space_id
      JOIN users u ON b.tenant_id = u.user_id
      WHERE s.host_id = $1
      ORDER BY b.start_date DESC
    `;

    try {
      const result = await db.query(query, [hostId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(bookingId, updateData) {
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
      UPDATE bookings
      SET ${setClauses.join(', ')}
      WHERE booking_id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, [bookingId, ...values]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BookingModel;