import pool from '../postgres';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  profile_picture?: string;
  bio?: string;
  full_name?: string;
  created_at?: Date;
}

export const UserModel = {
  async findAll(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY username ASC');
    return result.rows;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },

  async findById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async matchPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  },

  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password, profile_picture, bio, full_name) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.username, user.email, hashedPassword, user.profile_picture || null, user.bio || null, user.full_name || null]
    );
    return result.rows[0];
  },

  async update(id: number, updates: Partial<User>): Promise<User | null> {
    const fields = Object.keys(updates)
      .filter(key => key !== 'id')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id')
      .map(([_, value]) => value);

    if (fields.length === 0) {
      return await UserModel.findById(id);
    }

    const result = await pool.query(
      `UPDATE users SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  },

  async isFollowing(followerId: number | string, followingId: number | string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    return result.rows.length > 0;
  },

  async follow(followerId: number | string, followingId: number | string): Promise<void> {
    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [followerId, followingId]
    );
  },

  async unfollow(followerId: number | string, followingId: number | string): Promise<void> {
    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
  },

  async getFollowingWithDetails(userId: number | string): Promise<any[]> {
    const result = await pool.query(
      `SELECT u.id, u.username, u.profile_pic 
       FROM follows f 
       JOIN users u ON f.following_id = u.id 
       WHERE f.follower_id = $1 
       ORDER BY u.username ASC`,
      [userId]
    );
    return result.rows.map(row => ({
      id: row.id.toString(),
      username: row.username,
      profilePic: row.profile_pic || null,
    }));
  },

  async getFollowing(userId: number): Promise<number[]> {
    const result = await pool.query(
      'SELECT following_id FROM follows WHERE follower_id = $1',
      [userId]
    );
    return result.rows.map(row => row.following_id);
  },

  async getFollowers(userId: number): Promise<number[]> {
    const result = await pool.query(
      'SELECT follower_id FROM follows WHERE following_id = $1',
      [userId]
    );
    return result.rows.map(row => row.follower_id);
  }
};
