import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { GroupsService } from './groups.services.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UpdateGroupDto } from './dto/update-grouo.dto.js';
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll(@Req() req: any) {
    console.log('========== GET GROUPS ==========');
    console.log('REQ.USER:', req.user);

    return this.groupsService.findAllForUser(req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  create(@Body() body: CreateGroupDto, @Req() req: any) {
    console.log('========== CREATE GROUP ==========');
    console.log('ADMIN:', req.user);
    console.log('BODY:', body);

    return this.groupsService.create(req.user.id, body);
  }

  @Post(':id/members')
  addMember(
    @Param('id') groupId: string,
    @Body('userId') userId: string,
    @Req() req: any,
  ) {
    return this.groupsService.addMember(
      groupId,
      userId,
      req.user.id,
      req.user.role,
    );
  }
  @Patch(':id')
updateGroup(
  @Param('id') groupId: string,
  @Body() body: UpdateGroupDto,
  @Req() req: any,
) {
  return this.groupsService.updateGroup(
    groupId,
    body,
    req.user.role,
  );
}
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') groupId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.groupsService.removeMember(
      groupId,
      userId,
      req.user.id,
      req.user.role,
    );
  }
}
