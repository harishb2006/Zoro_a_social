import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IFollow extends Document {
  _id: mongoose.Types.ObjectId;
  follower_id: mongoose.Types.ObjectId;
  following_id: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    follower_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    following_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate follows
FollowSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });

const Follow = models.Follow || model<IFollow>('Follow', FollowSchema);

export default Follow;
