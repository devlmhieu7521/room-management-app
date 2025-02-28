const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
  static async create(userData) {
    const { email, password, first_name, last_name } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (user_id, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [uuidv4(), email, password_hash, first_name, last_name];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';

    try {
      const result = await db.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findById(userId) {
    const query = 'SELECT * FROM users WHERE user_id = $1';

    try {
      const result = await db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;