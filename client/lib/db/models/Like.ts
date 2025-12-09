import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface ILike extends Document {
  _id: mongoose.Types.ObjectId;
  post_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
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
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate likes
LikeSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

const Like = models.Like || model<ILike>('Like', LikeSchema);

export default Like;
