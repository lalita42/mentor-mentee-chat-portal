import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Message, MessageSchema } from './schemas/message.schema.js';

import { User, UserSchema } from '../auth/schemas/user.schema.js';

import { Group, GroupSchema } from '../groups/schemas/group.schema.js';

import { ReportsModule } from '../reports/reports.module.js';

import { MessagesController } from './messages.controller.js';

import { MessagesService } from './messages.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessageSchema,
      },

      {
        name: User.name,
        schema: UserSchema,
      },

      {
        name: Group.name,
        schema: GroupSchema,
      },
    ]),

    ReportsModule,
  ],

  controllers: [MessagesController],

  providers: [MessagesService],

  exports: [MessagesService],
})
export class MessagesModule {}
