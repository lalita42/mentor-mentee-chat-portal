import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,

    private readonly configService: ConfigService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'development-secret';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: jwtSecret,
    });

    console.log('JWT Strategy initialized');

    console.log(
      'JWT_SECRET exists:',
      Boolean(configService.get<string>('JWT_SECRET')),
    );
  }

  async validate(payload: any) {
    console.log('JWT PAYLOAD:', {
      sub: payload?.sub,
      role: payload?.role,
    });

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    return this.authService.validateUserById(payload.sub);
  }
}
