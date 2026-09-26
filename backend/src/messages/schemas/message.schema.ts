import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ChatType, MessageType } from '../../common/enums.js';

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  timestamps: true,
})
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  senderId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Group',
    default: null,
  })
  groupId: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  recipientId: Types.ObjectId | null;

  @Prop({
    required: true,
    enum: ChatType,
  })
  chatType: ChatType;

  @Prop({
    required: true,
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Prop({
    default: '',
    trim: true,
  })
  content: string;

  @Prop({
    type: String,
    default: null,
  })
  fileUrl: string | null;

  @Prop({
    type: String,
    default: null,
  })
  fileName: string | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'Message',
    default: null,
  })
  replyTo: Types.ObjectId | null;

  @Prop({
    default: false,
  })
  pinned: boolean;

  @Prop({
    default: false,
  })
  doubt: boolean;

  @Prop({
    default: false,
  })
  resolved: boolean;

  @Prop({
    default: false,
  })
  deleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({
  groupId: 1,
  createdAt: 1,
});

MessageSchema.index({
  senderId: 1,
  recipientId: 1,
  createdAt: 1,
});
