import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema.js';
import { User, UserDocument } from '../auth/schemas/user.schema.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-grouo.dto.js';
import { Role } from '../common/enums.js';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name)
    private readonly groupModel: Model<GroupDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // =========================
  // CREATE GROUP
  // =========================

  async create(adminId: string, dto: CreateGroupDto) {
    if (!Types.ObjectId.isValid(adminId)) {
      throw new BadRequestException('Invalid admin ID');
    }

    const memberIds = dto.memberIds || [];

    const validMemberIds = memberIds.filter((id) => Types.ObjectId.isValid(id));

    const validUsers = await this.userModel.find({
      _id: {
        $in: validMemberIds,
      },
      isActive: true,
    });

    const memberObjectIds = validUsers.map((user) => user._id);

    const group = await this.groupModel.create({
      name: dto.name,

      createdBy: new Types.ObjectId(adminId),

      members: memberObjectIds,
    });

    return this.populateGroup(group._id);
  }

  // =========================
  // GET GROUPS FOR USER
  // =========================

  async findAllForUser(userId: string, role: Role) {
    console.log('========== FIND GROUPS ==========');
    console.log('USER ID:', userId);
    console.log('ROLE:', role);

    if (!Types.ObjectId.isValid(userId)) {
      console.log('INVALID USER ID');
      return [];
    }

    let filter: any = {};

    // ADMIN CAN SEE ALL GROUPS
    if (role === Role.ADMIN) {
      filter = {};
    }

    // MENTOR / MENTEE ONLY SEE THEIR GROUPS
    else {
      filter = {
        members: new Types.ObjectId(userId),
      };
    }

    console.log('GROUP FILTER:', filter);

    const groups = await this.groupModel
      .find(filter)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role')
      .sort({
        updatedAt: -1,
      });

    console.log('GROUPS FOUND:', groups.length);

    return groups;
  }

  // =========================
  // GET ONE GROUP
  // =========================

  async findOne(groupId: string, userId: string, role: Role) {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new BadRequestException('Invalid group ID');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const group = await this.groupModel
      .findById(groupId)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // ADMIN CAN OPEN ANY GROUP
    if (role === Role.ADMIN) {
      return group;
    }

    // MENTOR / MENTEE MUST BE MEMBER
    const isMember = group.members.some(
      (member: any) => member._id.toString() === userId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return group;
  }

  // =========================
  // ADD MEMBER
  // =========================

  async addMember(
    groupId: string,
    targetUserId: string,
    actorId: string,
    actorRole: Role,
  ) {
    // ONLY ADMIN
    if (actorRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can add group members');
    }

    if (!Types.ObjectId.isValid(groupId)) {
      throw new BadRequestException('Invalid group ID');
    }

    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findOne({
      _id: targetUserId,
      isActive: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const group = await this.groupModel.findByIdAndUpdate(
      groupId,
      {
        $addToSet: {
          members: new Types.ObjectId(targetUserId),
        },
      },
      {
        new: true,
      },
    );

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.populateGroup(group._id);
  }

  // =========================
  // REMOVE MEMBER
  // =========================

  async removeMember(
    groupId: string,
    targetUserId: string,
    actorId: string,
    actorRole: Role,
  ) {
    // ONLY ADMIN
    if (actorRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can remove group members');
    }

    if (!Types.ObjectId.isValid(groupId)) {
      throw new BadRequestException('Invalid group ID');
    }

    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const group = await this.groupModel.findByIdAndUpdate(
      groupId,
      {
        $pull: {
          members: new Types.ObjectId(targetUserId),
        },
      },
      {
        new: true,
      },
    );

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.populateGroup(group._id);
  }

  // UPDATE MEMBERS 
  async updateGroup(
  groupId: string,
  dto: UpdateGroupDto,
  actorRole: Role,
) {
  if (actorRole !== Role.ADMIN) {
    throw new ForbiddenException('Only admin can edit groups');
  }

  if (!Types.ObjectId.isValid(groupId)) {
    throw new BadRequestException('Invalid group ID');
  }

  const group = await this.groupModel.findById(groupId);

  if (!group) {
    throw new NotFoundException('Group not found');
  }

  if (dto.name !== undefined) {
    group.name = dto.name.trim();
  }

  if (dto.memberIds !== undefined) {
    const validMemberIds = dto.memberIds.filter((id) =>
      Types.ObjectId.isValid(id),
    );

    const validUsers = await this.userModel.find({
      _id: { $in: validMemberIds },
      isActive: true,
    });

    group.members = validUsers.map((user) => user._id);
  }

  await group.save();

  return this.populateGroup(group._id);
}
  // =========================
  // POPULATE GROUP
  // =========================

  private populateGroup(id: any) {
    return this.groupModel
      .findById(id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');
  }
}
