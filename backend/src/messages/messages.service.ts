import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Message, MessageDocument } from './schemas/message.schema.js';

import { User, UserDocument } from '../auth/schemas/user.schema.js';

import { Group, GroupDocument } from '../groups/schemas/group.schema.js';

import { ChatType, MessageType, Role } from '../common/enums.js';

import { CreateMessageDto } from './dto/create.message.dto.js';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Group.name)
    private readonly groupModel: Model<GroupDocument>,
  ) {}

  // --------------------------------
  // GROUP ACCESS
  // --------------------------------

  private async getGroup(groupId: string) {
    const group = await this.groupModel.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  private isGroupMember(group: GroupDocument, userId: string) {
    return group.members.some((member) => member.toString() === userId);
  }

  // --------------------------------
  // PRIVATE CHAT AUTHORIZATION
  // --------------------------------

  private async validatePrivateChat(
    senderId: string,
    recipientId: string,
    senderRole: Role,
  ) {
    const recipient = await this.userModel.findById(recipientId);

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    if (senderRole === Role.MENTEE && recipient.role !== Role.MENTOR) {
      throw new ForbiddenException(
        'Mentee can privately chat only with a mentor',
      );
    }

    if (senderRole === Role.MENTOR && recipient.role !== Role.MENTEE) {
      throw new ForbiddenException(
        'Mentor can privately chat only with a mentee',
      );
    }

    // Admin can communicate with anyone.
    if (senderRole === Role.ADMIN) {
      return;
    }

    // Mentor and mentee must share at least
    // one group.
    const commonGroup = await this.groupModel.findOne({
      members: {
        $all: [new Types.ObjectId(senderId), new Types.ObjectId(recipientId)],
      },
    });

    if (!commonGroup) {
      throw new ForbiddenException(
        'Private chat is allowed only between members of the same group',
      );
    }
  }

  // --------------------------------
  // CREATE MESSAGE
  // --------------------------------

  async create(user: any, dto: CreateMessageDto) {
    if (
      !dto.content &&
      dto.type !== MessageType.IMAGE &&
      dto.type !== MessageType.PDF
    ) {
      throw new ForbiddenException('Message content cannot be empty');
    }

    if (dto.chatType === ChatType.GROUP) {
      if (!dto.groupId) {
        throw new ForbiddenException('groupId is required');
      }

      const group = await this.getGroup(dto.groupId);

      if (user.role !== Role.ADMIN && !this.isGroupMember(group, user.id)) {
        throw new ForbiddenException('You are not a member of this group');
      }
    }

    if (dto.chatType === ChatType.PRIVATE) {
      if (!dto.recipientId) {
        throw new ForbiddenException('recipientId is required');
      }

      await this.validatePrivateChat(user.id, dto.recipientId, user.role);
    }

    if (dto.replyTo) {
      const replyMessage = await this.messageModel.findById(dto.replyTo);

      if (!replyMessage) {
        throw new NotFoundException('Reply message not found');
      }
    }

    const message = await this.messageModel.create({
      senderId: new Types.ObjectId(user.id),

      groupId: dto.groupId ? new Types.ObjectId(dto.groupId) : null,

      recipientId: dto.recipientId ? new Types.ObjectId(dto.recipientId) : null,

      chatType: dto.chatType,

      type: dto.type || MessageType.TEXT,

      content: dto.content || '',

      replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : null,
    });

    return this.populateMessage(message._id);
  }

  // --------------------------------
  // MESSAGE HISTORY
  // --------------------------------

  async getHistory(user: any, groupId?: string, otherUserId?: string) {
    if (groupId) {
      const group = await this.getGroup(groupId);

      if (user.role !== Role.ADMIN && !this.isGroupMember(group, user.id)) {
        throw new ForbiddenException('You are not a member of this group');
      }

      return this.messageModel
        .find({
          groupId: new Types.ObjectId(groupId),

          chatType: ChatType.GROUP,
        })
        .populate('senderId', 'name email role')
        .populate('replyTo', 'content senderId type')
        .sort({
          createdAt: 1,
        })
        .limit(500);
    }

    if (otherUserId) {
      await this.validatePrivateChat(user.id, otherUserId, user.role);

      return this.messageModel
        .find({
          chatType: ChatType.PRIVATE,

          $or: [
            {
              senderId: new Types.ObjectId(user.id),

              recipientId: new Types.ObjectId(otherUserId),
            },

            {
              senderId: new Types.ObjectId(otherUserId),

              recipientId: new Types.ObjectId(user.id),
            },
          ],
        })
        .populate('senderId', 'name email role')
        .populate('recipientId', 'name email role')
        .populate('replyTo', 'content senderId type')
        .sort({
          createdAt: 1,
        })
        .limit(500);
    }

    throw new ForbiddenException('groupId or otherUserId is required');
  }

  // --------------------------------
  // PIN / UNPIN
  // --------------------------------

  async togglePin(messageId: string, user: any) {
    const message = await this.getMessage(messageId);

    if (!message.groupId) {
      throw new ForbiddenException('Only group messages can be pinned');
    }

    await this.validateGroupPermission(message.groupId.toString(), user);

    message.pinned = !message.pinned;

    await message.save();

    return this.populateMessage(message._id);
  }

  // --------------------------------
  // DOUBT
  // --------------------------------

  async toggleDoubt(messageId: string, user: any) {
    const message = await this.getMessage(messageId);

    if (!message.groupId) {
      throw new ForbiddenException('Doubts can only be marked in groups');
    }

    const group = await this.getGroup(message.groupId.toString());

    if (!this.isGroupMember(group, user.id) && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Mentee can only mark their own message.
    if (user.role === Role.MENTEE) {
      if (message.senderId.toString() !== user.id) {
        throw new ForbiddenException(
          'You can mark only your own message as a doubt',
        );
      }

      message.doubt = !message.doubt;

      if (!message.doubt) {
        message.resolved = false;
      }
    }

    // Mentor/Admin can resolve.
    if (user.role === Role.MENTOR || user.role === Role.ADMIN) {
      message.resolved = !message.resolved;

      if (message.resolved) {
        message.doubt = true;
      }
    }

    await message.save();

    return this.populateMessage(message._id);
  }

  // --------------------------------
  // ANNOUNCEMENT
  // --------------------------------

  async toggleAnnouncement(messageId: string, user: any) {
    const message = await this.getMessage(messageId);

    if (!message.groupId) {
      throw new ForbiddenException('Announcement must belong to a group');
    }

    await this.validateGroupPermission(message.groupId.toString(), user);

    if (user.role !== Role.MENTOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only mentor or admin can create announcements',
      );
    }

    if (message.type === MessageType.ANNOUNCEMENT) {
      message.type = MessageType.TEXT;
    } else {
      message.type = MessageType.ANNOUNCEMENT;
    }

    await message.save();

    return this.populateMessage(message._id);
  }

  // --------------------------------
  // DELETE MESSAGE
  // --------------------------------

  async remove(messageId: string, user: any) {
    const message = await this.getMessage(messageId);

    const ownMessage = message.senderId.toString() === user.id;

    if (ownMessage) {
      message.deleted = true;
      message.content = 'This message was deleted';
      message.fileUrl = null;
      message.fileName = null;

      await message.save();

      return this.populateMessage(message._id);
    }

    if (
      message.groupId &&
      (user.role === Role.MENTOR || user.role === Role.ADMIN)
    ) {
      await this.validateGroupPermission(message.groupId.toString(), user);

      message.deleted = true;
      message.content = 'This message was deleted';
      message.fileUrl = null;
      message.fileName = null;

      await message.save();

      return this.populateMessage(message._id);
    }

    throw new ForbiddenException('You cannot delete this message');
  }

  // --------------------------------
  // FILE ATTACHMENT
  // --------------------------------

  async attachFile(messageId: string, user: any, file: Express.Multer.File) {
    if (!file) {
      throw new ForbiddenException('File is required');
    }

    const message = await this.getMessage(messageId);

    if (message.senderId.toString() !== user.id) {
      throw new ForbiddenException('Only message owner can attach a file');
    }

    const isImage = file.mimetype.startsWith('image/');

    const isPdf = file.mimetype === 'application/pdf';

    if (!isImage && !isPdf) {
      throw new ForbiddenException('Only images and PDF files are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new ForbiddenException('Maximum file size is 5 MB');
    }

    message.type = isImage ? MessageType.IMAGE : MessageType.PDF;

    message.fileUrl = `/uploads/${file.filename}`;

    message.fileName = file.originalname;

    await message.save();

    return this.populateMessage(message._id);
  }

  // --------------------------------
  // COMMON HELPERS
  // --------------------------------

  private async getMessage(messageId: string) {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  private async validateGroupPermission(groupId: string, user: any) {
    const group = await this.getGroup(groupId);

    if (user.role === Role.ADMIN) {
      return;
    }

    if (!this.isGroupMember(group, user.id)) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }

  async populateMessage(messageId: any) {
    return this.messageModel
      .findById(messageId)
      .populate('senderId', 'name email role')
      .populate('recipientId', 'name email role')
      .populate('replyTo', 'content senderId type');
  }
}
