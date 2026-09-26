import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { GroupsModule } from '../groups/groups.module.js';

import { MessagesModule } from '../messages/messages.module.js';

import { ChatGateway } from './chat.gateway.js';

@Module({
  imports: [AuthModule, GroupsModule, MessagesModule],

  providers: [ChatGateway],
})
export class ChatModule {}
