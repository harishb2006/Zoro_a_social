import pool from '../postgres';

export interface Post {
  id: number;
  caption?: string;
  location?: string;
  tags?: string;
  imageurl?: string;
  videourl?: string;
  likes?: number;
  saves?: number;
  created_by: number;
  created_at?: Date;
}

export const PostModel = {
  async findAll(): Promise<Post[]> {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    return result.rows;
  },

  async findById(id: number): Promise<Post | null> {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId: number): Promise<Post[]> {
    const result = await pool.query('SELECT * FROM posts WHERE created_by = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  },

  async create(post: Omit<Post, 'id' | 'created_at' | 'likes' | 'saves'>): Promise<Post> {
    const result = await pool.query(
      `INSERT INTO posts (caption, location, tags, imageurl, videourl, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [post.caption || null, post.location || null, post.tags || null, post.imageurl || null, post.videourl || null, post.created_by]
    );
    return result.rows[0];
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  },

  async hasLiked(postId: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    return result.rows.length > 0;
  },

  async like(postId: number, userId: number): Promise<void> {
    await pool.query(
      'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId]
    );
    await pool.query('UPDATE posts SET likes = likes + 1 WHERE id = $1', [postId]);
  },

  async unlike(postId: number, userId: number): Promise<void> {
    await pool.query(
      'DELETE FROM likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    await pool.query('UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = $1', [postId]);
  },

  async hasSaved(postId: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM saves WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    return result.rows.length > 0;
  },

  async save(postId: number, userId: number): Promise<void> {
    await pool.query(
      'INSERT INTO saves (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [postId, userId]
    );
    await pool.query('UPDATE posts SET saves = saves + 1 WHERE id = $1', [postId]);
  },

  async unsave(postId: number, userId: number): Promise<void> {
    await pool.query(
      'DELETE FROM saves WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    await pool.query('UPDATE posts SET saves = GREATEST(saves - 1, 0) WHERE id = $1', [postId]);
  },

  async findSavedByUser(userId: number): Promise<Post[]> {
    const result = await pool.query(
      `SELECT p.* FROM posts p
       INNER JOIN saves s ON p.id = s.post_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findByFollowing(userId: number): Promise<Post[]> {
    const result = await pool.query(
      `SELECT p.* FROM posts p
       INNER JOIN follows f ON p.created_by = f.following_id
       WHERE f.follower_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async update(id: number, updates: Partial<Post>): Promise<Post | null> {
    const fields = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (!fields) return null;
    
    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'created_at')
      .map(([, value]) => value);
    
    const result = await pool.query(
      `UPDATE posts SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }
};
