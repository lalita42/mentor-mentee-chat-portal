import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { JwtService } from '@nestjs/jwt';

import { UnauthorizedException } from '@nestjs/common';

import { MessagesService } from '../messages/messages.service.js';

import { GroupsService } from '../groups/groups.services.js';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',

    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,

    private readonly messagesService: MessagesService,

    private readonly groupsService: GroupsService,
  ) {}

  // --------------------------------
  // CONNECTION
  // --------------------------------

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);

      const userId = payload.sub;

      if (!userId) {
        client.disconnect();
        return;
      }

      client.data.user = {
        id: userId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };

      this.onlineUsers.set(userId, client.id);

      client.join(`user:${userId}`);

      this.server.emit('presence:update', Array.from(this.onlineUsers.keys()));

      console.log(`Socket connected: ${userId}`);
    } catch (error) {
      client.disconnect();
    }
  }

  // --------------------------------
  // DISCONNECT
  // --------------------------------

  handleDisconnect(client: Socket) {
    const user = client.data.user;

    if (user) {
      this.onlineUsers.delete(user.id);

      this.server.emit('presence:update', Array.from(this.onlineUsers.keys()));
    }
  }

  // --------------------------------
  // JOIN GROUP
  // --------------------------------

  @SubscribeMessage('join_group')
  async joinGroup(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      groupId: string;
    },
  ) {
    const user = client.data.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    // This checks group membership.
    await this.groupsService.findOne(data.groupId, user.id, user.role);

    const room = `group:${data.groupId}`;

    client.join(room);

    client.emit('group_joined', {
      groupId: data.groupId,
    });
  }

  // --------------------------------
  // LEAVE GROUP
  // --------------------------------

  @SubscribeMessage('leave_group')
  leaveGroup(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      groupId: string;
    },
  ) {
    client.leave(`group:${data.groupId}`);
  }

  // --------------------------------
  // TYPING
  // --------------------------------

  @SubscribeMessage('typing')
  typing(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      room: string;
      isTyping: boolean;
    },
  ) {
    client.to(data.room).emit('typing', {
      userId: client.data.user?.id,

      isTyping: data.isTyping,
    });
  }

  // --------------------------------
  // SEND MESSAGE
  // --------------------------------

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: any,
  ) {
    const user = client.data.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    const message = await this.messagesService.create(user, data);

    // GROUP MESSAGE
    if (data.chatType === 'GROUP' && data.groupId) {
      this.server.to(`group:${data.groupId}`).emit('message:new', message);
    }

    // PRIVATE MESSAGE
    if (data.chatType === 'PRIVATE' && data.recipientId) {
      this.server.to(`user:${data.recipientId}`).emit('message:new', message);

      client.emit('message:new', message);
    }

    return message;
  }
}
