import pool from '../postgres';

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  text: string;
  created_at?: Date;
}

export const CommentModel = {
  async findByPostId(postId: number): Promise<Comment[]> {
    const result = await pool.query(
      `SELECT c.*, u.username, u.profile_picture 
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 
       ORDER BY c.created_at DESC`,
      [postId]
    );
    return result.rows;
  },

  async create(comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment> {
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, text) 
       VALUES ($1, $2, $3) RETURNING *`,
      [comment.post_id, comment.user_id, comment.text]
    );
    return result.rows[0];
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM comments WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
};
