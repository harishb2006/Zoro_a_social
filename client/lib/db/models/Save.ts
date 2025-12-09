import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface ISave extends Document {
  _id: mongoose.Types.ObjectId;
  post_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SaveSchema = new Schema<ISave>(
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

// Compound unique index to prevent duplicate saves
SaveSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

const Save = models.Save || model<ISave>('Save', SaveSchema);

export default Save;
