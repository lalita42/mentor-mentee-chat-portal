import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './schemas/group.schema.js';
import { User, UserSchema } from '../auth/schemas/user.schema.js';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.services.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Group.name,
        schema: GroupSchema,
      },

      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [GroupsController],

  providers: [GroupsService],

  exports: [GroupsService],
})
export class GroupsModule {}
