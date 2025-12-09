import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  receiver_id: mongoose.Types.ObjectId;
  message: string;
  is_read: boolean;
  conversation_id: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    conversation_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Message = models.Message || model<IMessage>('Message', MessageSchema);

export default Message;
