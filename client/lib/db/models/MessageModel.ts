import pool from '../postgres';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  conversation_id: string;
  created_at?: Date;
}

export const MessageModel = {
  async findConversation(userId1: number, userId2: number): Promise<Message[]> {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId1, userId2]
    );
    return result.rows;
  },

  async findById(id: number): Promise<Message | null> {
    const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message, is_read, conversation_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [message.sender_id, message.receiver_id, message.message, message.is_read || false, message.conversation_id]
    );
    return result.rows[0];
  },

  async markAsRead(conversationId: string, userId: number): Promise<void> {
    await pool.query(
      'UPDATE messages SET is_read = true WHERE conversation_id = $1 AND receiver_id = $2',
      [conversationId, userId]
    );
  },

  async getConversations(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT DISTINCT ON (conversation_id)
        m.*,
        CASE 
          WHEN m.sender_id = $1 THEN u_receiver.id
          ELSE u_sender.id
        END as other_user_id,
        CASE 
          WHEN m.sender_id = $1 THEN u_receiver.username
          ELSE u_sender.username
        END as other_user_username,
        CASE 
          WHEN m.sender_id = $1 THEN u_receiver.profile_picture
          ELSE u_sender.profile_picture
        END as other_user_profile_picture
       FROM messages m
       LEFT JOIN users u_sender ON m.sender_id = u_sender.id
       LEFT JOIN users u_receiver ON m.receiver_id = u_receiver.id
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY m.conversation_id, m.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getMessages(conversationId: string, userId: number): Promise<Message[]> {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 
       AND (sender_id = $2 OR receiver_id = $2)
       ORDER BY created_at ASC`,
      [conversationId, userId]
    );
    return result.rows;
  },

  async acceptRequest(conversationId: string, userId: number): Promise<boolean> {
    // For simplicity, we can just mark all messages in the conversation as accepted
    // You might want to add a separate 'accepted' column to track this
    return true;
  },

  async declineRequest(conversationId: string, userId: number): Promise<boolean> {
    // Delete all messages in the conversation
    await pool.query(
      'DELETE FROM messages WHERE conversation_id = $1 AND receiver_id = $2',
      [conversationId, userId]
    );
    return true;
  },

  async blockUser(blockerId: number, blockedId: number): Promise<void> {
    // Delete all messages between the two users
    await pool.query(
      'DELETE FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
      [blockerId, blockedId]
    );
  },

  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    // No-op since we don't have a blocks table
    // Just a placeholder to match the API
  },

  async getMessageRequests(userId: number): Promise<any[]> {
    // Get all conversations where the user is the receiver and hasn't sent a reply yet
    const result = await pool.query(
      `SELECT DISTINCT ON (m.conversation_id)
        m.*,
        u_sender.id as sender_id,
        u_sender.username as sender_username,
        u_sender.profile_picture as sender_profile_picture
       FROM messages m
       JOIN users u_sender ON m.sender_id = u_sender.id
       WHERE m.receiver_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM messages m2
         WHERE m2.conversation_id = m.conversation_id
         AND m2.sender_id = $1
       )
       ORDER BY m.conversation_id, m.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
};
