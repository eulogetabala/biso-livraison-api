import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../../config/configuration';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  phone: string;
  email: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<AppConfig>,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.getOrThrow<AppConfig['jwt']>('jwt').secret;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        isBlocked: true,
        partnerRestaurantId: true,
      },
    });

    if (!user || user.isBlocked) {
      throw new UnauthorizedException('Compte invalide ou bloqué');
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      partnerRestaurantId: user.partnerRestaurantId,
    };
  }
}
