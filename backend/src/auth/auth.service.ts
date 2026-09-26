import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema.js';

import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';

import { Role } from '../common/enums.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly jwtService: JwtService,
  ) {}

  private sanitizeUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private generateToken(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase();

    const existingUser = await this.userModel.findOne({
      email,
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Admin requires special code
    if (
      dto.role === Role.ADMIN &&
      dto.adminCode !== process.env.ADMIN_SIGNUP_CODE
    ) {
      throw new UnauthorizedException('Invalid admin signup code');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      name: dto.name,
      email,
      password: hashedPassword,
      role: dto.role,
    });

    return {
      user: this.sanitizeUser(user),
      token: this.generateToken(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      user: this.sanitizeUser(user),
      token: this.generateToken(user),
    };
  }

  async validateUserById(id: string) {
    const user = await this.userModel.findById(id);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }
}
