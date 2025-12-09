import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  caption?: string;
  location?: string;
  tags?: string;
  imageurl?: string;
  videourl?: string;
  likes: number;
  saves: number;
  created_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    caption: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    tags: {
      type: String,
      default: '',
    },
    imageurl: {
      type: String,
      default: null,
    },
    videourl: {
      type: String,
      default: null,
    },
    likes: {
      type: Number,
      default: 0,
    },
    saves: {
      type: Number,
      default: 0,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Post = models.Post || model<IPost>('Post', PostSchema);

export default Post;
