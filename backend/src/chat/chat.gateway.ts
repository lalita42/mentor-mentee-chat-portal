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
  transports: ['websocket'],
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Set<string>>();

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
        console.log('❌ Socket rejected: token missing');
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token);

      const userId = payload.sub;

      if (!userId) {
        console.log('❌ Socket rejected: user ID missing');
        client.disconnect(true);
        return;
      }
      const normalizedUserId = String(userId);

      client.data.user = {
        id: normalizedUserId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };

      let userSockets = this.onlineUsers.get(normalizedUserId);

      if (!userSockets) {
        userSockets = new Set<string>();
        this.onlineUsers.set(normalizedUserId, userSockets);
      }

      userSockets.add(client.id);

      // Personal room
      client.join(`user:${normalizedUserId}`);

      console.log('🟢 Socket connected');
      console.log('User:', normalizedUserId);
      console.log('Socket:', client.id);

      // Send current presence to everyone

      this.broadcastPresence();
   // Also send current presence directly to this client
 
      client.emit('presence:update', Array.from(this.onlineUsers.keys()),
    
    
      );
    } catch (error) {
      console.error('❌ Socket authentication failed:', error);

      client.disconnect(true);
    }
  }


  // SOCKET DISCONNECT
  

  handleDisconnect(client: Socket) {
    const user = client.data?.user;

    if (!user) {
      console.log('🔌 Unknown socket disconnected:',
        client.id,);

      return;
    }

    const userId = String(user.id);

    const userSockets = this.onlineUsers.get(userId);

    if (!userSockets) {
      return;
    }

    // Remove only this socket
    userSockets.delete(client.id);
      // User still has another tab/device connected
 
    if (userSockets.size > 0) {
      this.onlineUsers.set(userId, userSockets);

      console.log( `🔌 One socket disconnected for ${userId}`, );
      console.log( `Remaining sockets: ${userSockets.size}`,);

      this.broadcastPresence();

      return;
    }

     // No sockets left -> user is offline
  
    this.onlineUsers.delete(userId);

    console.log(`⚪ User offline: ${userId}`);

    this.broadcastPresence();
  }

  // PRESENCE BROADCAST
 
  private broadcastPresence() {
    const onlineUserIds = Array.from(
      this.onlineUsers.keys(),
    );

    console.log(
      '👥 Online users:',
      onlineUserIds,
    );

    this.server.emit('presence:update',
      onlineUserIds,
    );
  }

  // GET CURRENT PRESENCE
 
  @SubscribeMessage('presence:get')
  getPresence(
    @ConnectedSocket() client: Socket,
  ) {
    const onlineUserIds = Array.from(
      this.onlineUsers.keys(),
    );

    client.emit(
      'presence:update',
      onlineUserIds,
    );
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
