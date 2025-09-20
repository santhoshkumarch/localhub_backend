const pool = require('../config/database');

class User {
  static async getAll() {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      district: row.district,
      businessCount: row.business_count,
      postsCount: row.posts_count,
      isActive: row.is_active,
      isVerified: row.is_verified,
      joinedDate: row.joined_date,
      lastActive: row.last_active,
      avatar: row.avatar,
      userType: row.user_type
    }));
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      district: row.district,
      businessCount: row.business_count,
      postsCount: row.posts_count,
      isActive: row.is_active,
      isVerified: row.is_verified,
      joinedDate: row.joined_date,
      lastActive: row.last_active,
      avatar: row.avatar,
      userType: row.user_type
    };
  }

  static async update(id, data) {
    const result = await pool.query(
      'UPDATE users SET name = $1, phone = $2, district = $3 WHERE id = $4 RETURNING *',
      [data.name, data.phone, data.district, id]
    );
    if (result.rows.length === 0) return null;
    return this.getById(id);
  }

  static async create(userData) {
    const { name, email, phone, district, userType = 'individual' } = userData;
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, district, user_type, is_active, is_verified, joined_date, business_count, posts_count) VALUES ($1, $2, $3, $4, $5, true, false, NOW(), 0, 0) RETURNING *',
      [name, email, phone, district, userType]
    );
    return this.getById(result.rows[0].id);
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
  }

  static async toggleStatus(id) {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.getById(id);
  }
}

module.exports = User;