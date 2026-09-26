import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema.js';
import { Role } from '../common/enums.js';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}
  async findAll(role?: string) {
    const filter: any = {};
    /*
     * Optional role filter
     * /users?role=MENTOR
     * /users?role=MENTEE
     * /users?role=ADMIN
     */

    if (role) {
      if (!Object.values(Role).includes(role as Role)) {
        return [];
      }

      filter.role = role;
    }

    const users = await this.userModel
      .find(filter)
      .select('_id name email role isActive createdAt')
      .sort({
        name: 1,
      })
      .lean();

    return users;
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('_id name email role isActive createdAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
