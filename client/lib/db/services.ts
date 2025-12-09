import connectDB from './mongodb';
import User from './models/User';
import Post from './models/Post';
import Comment from './models/Comment';
import Message from './models/Message';
import Follow from './models/Follow';
import Like from './models/Like';
import Save from './models/Save';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const UserService = {
  async findByEmail(email: string) {
    await connectDB();
    return await User.findOne({ email });
  },

  async findById(id: string) {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await User.findById(id);
  },

  async findByUsername(username: string) {
    await connectDB();
    return await User.findOne({ username });
  },

  async create(userData: { username: string; email: string; password: string }) {
    await connectDB();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return await User.create({ ...userData, password: hashedPassword });
  },

  async update(id: string, updates: any) {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await User.findByIdAndUpdate(id, updates, { new: true });
  },

  async isFollowing(followerId: string, followingId: string) {
    await connectDB();
    const follow = await Follow.findOne({ follower_id: followerId, following_id: followingId });
    return !!follow;
  },

  async follow(followerId: string, followingId: string) {
    await connectDB();
    await Follow.create({ follower_id: followerId, following_id: followingId });
  },

  async unfollow(followerId: string, followingId: string) {
    await connectDB();
    await Follow.deleteOne({ follower_id: followerId, following_id: followingId });
  },

  async getFollowing(userId: string) {
    await connectDB();
    const follows = await Follow.find({ follower_id: userId }).select('following_id');
    return follows.map(f => f.following_id.toString());
  },

  async getFollowers(userId: string) {
    await connectDB();
    const follows = await Follow.find({ following_id: userId }).select('follower_id');
    return follows.map(f => f.follower_id.toString());
  },

  async getFollowingWithDetails(userId: string) {
    await connectDB();
    const follows = await Follow.find({ follower_id: userId }).populate('following_id', 'username profile_picture');
    return follows.map(f => {
      const user = f.following_id as any;
      return {
        id: user._id.toString(),
        username: user.username,
        profilePic: user.profile_picture || null,
      };
    });
  },
};

export const PostService = {
  async findAll() {
    await connectDB();
    return await Post.find().sort({ createdAt: -1 }).populate('created_by', 'username profile_picture');
  },

  async findById(id: string) {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Post.findById(id).populate('created_by', 'username profile_picture');
  },

  async findByUserId(userId: string) {
    await connectDB();
    return await Post.find({ created_by: userId }).sort({ createdAt: -1 });
  },

  async create(postData: any) {
    await connectDB();
    return await Post.create(postData);
  },

  async update(id: string, updates: any) {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Post.findByIdAndUpdate(id, updates, { new: true });
  },

  async delete(id: string) {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await Post.findByIdAndDelete(id);
    if (result) {
      // Clean up related data
      await Like.deleteMany({ post_id: id });
      await Save.deleteMany({ post_id: id });
      await Comment.deleteMany({ post_id: id });
    }
    return !!result;
  },

  async hasLiked(postId: string, userId: string) {
    await connectDB();
    const like = await Like.findOne({ post_id: postId, user_id: userId });
    return !!like;
  },

  async like(postId: string, userId: string) {
    await connectDB();
    await Like.create({ post_id: postId, user_id: userId });
    await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });
  },

  async unlike(postId: string, userId: string) {
    await connectDB();
    await Like.deleteOne({ post_id: postId, user_id: userId });
    await Post.findByIdAndUpdate(postId, { $inc: { likes: -1 } });
  },

  async hasSaved(postId: string, userId: string) {
    await connectDB();
    const save = await Save.findOne({ post_id: postId, user_id: userId });
    return !!save;
  },

  async save(postId: string, userId: string) {
    await connectDB();
    await Save.create({ post_id: postId, user_id: userId });
    await Post.findByIdAndUpdate(postId, { $inc: { saves: 1 } });
  },

  async unsave(postId: string, userId: string) {
    await connectDB();
    await Save.deleteOne({ post_id: postId, user_id: userId });
    await Post.findByIdAndUpdate(postId, { $inc: { saves: -1 } });
  },

  async findSavedByUser(userId: string) {
    await connectDB();
    const saves = await Save.find({ user_id: userId }).populate('post_id');
    return saves.map(s => s.post_id).filter(p => p);
  },

  async findByFollowing(userId: string) {
    await connectDB();
    const follows = await Follow.find({ follower_id: userId }).select('following_id');
    const followingIds = follows.map(f => f.following_id);
    return await Post.find({ created_by: { $in: followingIds } }).sort({ createdAt: -1 });
  },
};

export const CommentService = {
  async findByPostId(postId: string) {
    await connectDB();
    const comments = await Comment.find({ post_id: postId })
      .sort({ createdAt: -1 })
      .populate('user_id', 'username profile_picture');
    
    return comments.map(c => {
      const user = c.user_id as any;
      return {
        id: c._id.toString(),
        post_id: c.post_id.toString(),
        user_id: user._id.toString(),
        text: c.text,
        username: user.username,
        profile_picture: user.profile_picture,
        created_at: c.createdAt,
      };
    });
  },

  async create(commentData: { post_id: string; user_id: string; text: string }) {
    await connectDB();
    const comment = await Comment.create(commentData);
    const populated = await Comment.findById(comment._id).populate('user_id', 'username profile_picture');
    const user = (populated?.user_id as any);
    return {
      id: populated?._id.toString(),
      post_id: populated?.post_id.toString(),
      user_id: user._id.toString(),
      text: populated?.text,
      username: user.username,
      profile_picture: user.profile_picture,
      created_at: populated?.createdAt,
    };
  },

  async delete(id: string) {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await Comment.findByIdAndDelete(id);
    return !!result;
  },
};

export const MessageService = {
  async getConversations(userId: string) {
    await connectDB();
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender_id: new mongoose.Types.ObjectId(userId) }, { receiver_id: new mongoose.Types.ObjectId(userId) }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversation_id',
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const conversations = await Promise.all(messages.map(async (m) => {
      const msg = m.lastMessage;
      const otherId = msg.sender_id.toString() === userId ? msg.receiver_id : msg.sender_id;
      const otherUser = await User.findById(otherId).select('username profile_picture');
      
      return {
        id: msg._id.toString(),
        conversation_id: msg.conversation_id,
        message: msg.message,
        created_at: msg.createdAt,
        is_read: msg.is_read,
        last_message_sender_id: msg.sender_id.toString(),
        other_user_id: otherId.toString(),
        other_user_username: otherUser?.username,
        other_user_profile_picture: otherUser?.profile_picture,
      };
    }));

    return conversations;
  },

  async getMessages(conversationId: string, userId: string) {
    await connectDB();
    const messages = await Message.find({ conversation_id: conversationId })
      .sort({ createdAt: 1 });
    
    return messages.map(m => ({
      id: m._id.toString(),
      sender_id: m.sender_id.toString(),
      receiver_id: m.receiver_id.toString(),
      message: m.message,
      is_read: m.is_read,
      conversation_id: m.conversation_id,
      created_at: m.createdAt,
    }));
  },

  async create(messageData: any) {
    await connectDB();
    const message: any = await Message.create(messageData);
    return {
      id: message._id.toString(),
      sender_id: message.sender_id.toString(),
      receiver_id: message.receiver_id.toString(),
      message: message.message,
      is_read: message.is_read,
      conversation_id: message.conversation_id,
      created_at: message.createdAt,
    };
  },

  async markAsRead(conversationId: string, userId: string) {
    await connectDB();
    await Message.updateMany(
      { conversation_id: conversationId, receiver_id: userId },
      { is_read: true }
    );
  },

  async blockUser(blockerId: string, blockedId: string) {
    await connectDB();
    await Message.deleteMany({
      $or: [
        { sender_id: blockerId, receiver_id: blockedId },
        { sender_id: blockedId, receiver_id: blockerId }
      ]
    });
  },

  async getMessageRequests(userId: string) {
    await connectDB();
    // Get conversations where user is receiver and hasn't sent a reply
    const conversations = await Message.aggregate([
      {
        $match: { receiver_id: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: '$conversation_id',
          firstMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const requests = await Promise.all(conversations.map(async (conv) => {
      const msg = conv.firstMessage;
      const sender = await User.findById(msg.sender_id).select('username profile_picture');
      
      // Check if user has replied
      const hasReplied = await Message.findOne({
        conversation_id: conv._id,
        sender_id: userId
      });

      if (!hasReplied) {
        return {
          id: msg._id.toString(),
          sender_id: sender?._id.toString(),
          sender_username: sender?.username,
          sender_profile_picture: sender?.profile_picture,
          message: msg.message,
          conversation_id: conv._id,
          created_at: msg.createdAt,
        };
      }
      return null;
    }));

    return requests.filter(r => r !== null);
  },
};
