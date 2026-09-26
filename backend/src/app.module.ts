import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { GroupsModule } from './groups/groups.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { ChatGateway } from './chat/chat.gateway.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.MONGO_URI!),

    AuthModule,

    UsersModule,

    GroupsModule,

    MessagesModule,

    ReportsModule,
  ],

  providers: [ChatGateway],
})
export class AppModule {}
