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