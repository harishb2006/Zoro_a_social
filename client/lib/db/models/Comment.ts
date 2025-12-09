import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  post_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  text: string;
  username?: string;
  profile_picture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = models.Comment || model<IComment>('Comment', CommentSchema);

export default Comment;
