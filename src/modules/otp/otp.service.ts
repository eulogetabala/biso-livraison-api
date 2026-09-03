import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { congoPhoneLookupVariants, normalizePhoneE164, validateCongoMobilePhone } from '../../common/utils/phone.util';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { RequestOtpInput } from './dto/request-otp.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { OtpRequestResult } from './models/otp-request-result.model';

const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_TTL_SEC = Math.floor(CODE_TTL_MS / 1000);
const MAX_ATTEMPTS = 5;
const REDIS_OTP_PREFIX = 'otp:pending:';

type PendingOtp = {
  code: string;
  expiresAt: number;
  attempts: number;
};

/**
 * OTP via Twilio Verify en production.
 * Fallback local (dev) : Redis si disponible, sinon mémoire process (single instance).
 */
@Injectable()
export class OtpService implements OnModuleInit {
  private readonly logger = new Logger(OtpService.name);
  private readonly memoryPending = new Map<string, PendingOtp>();
  private readonly isProduction: boolean;

  constructor(
    private readonly smsService: SmsService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    configService: ConfigService<AppConfig>,
  ) {
    this.isProduction = configService.getOrThrow<AppConfig['app']>('app').isProduction;
  }

  onModuleInit() {
    if (this.isProduction && !this.smsService.isVerifyConfigured) {
      throw new Error(
        'Production : configurez Twilio Verify (TWILIO_VERIFY_SERVICE_SID). ' +
          'En free tier Render, pas de Redis — OTP 100 % via Twilio.',
      );
    }
  }

  private key(phone: string): string {
    const result = validateCongoMobilePhone(phone);
    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        empty: 'Numéro de téléphone requis.',
        length: 'Numéro incomplet. Saisissez 9 chiffres (ex. 06 XXX XX XX).',
        prefix: 'Numéro mobile invalide. Il doit commencer par 06.',
        format: 'Numéro de téléphone invalide.',
      };
      throw new BadRequestException(messages[result.reason]);
    }
    return result.e164;
  }

  private redisKey(phone: string): string {
    return `${REDIS_OTP_PREFIX}${phone}`;
  }

  private async storePendingCode(phone: string, code: string) {
    const payload: PendingOtp = {
      code,
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
    };

    if (this.redis.isReady) {
      await this.redis.set(this.redisKey(phone), JSON.stringify(payload), CODE_TTL_SEC);
      return;
    }

    if (this.isProduction) {
      throw new BadRequestException('Service OTP temporairement indisponible.');
    }

    this.memoryPending.set(phone, payload);
  }

  private async findPending(phone: string): Promise<{ key: string; pending: PendingOtp } | null> {
    for (const variant of congoPhoneLookupVariants(phone)) {
      const key = normalizePhoneE164(variant);
      if (!key) continue;

      if (this.redis.isReady) {
        const raw = await this.redis.get(this.redisKey(key));
        if (raw) {
          try {
            return { key, pending: JSON.parse(raw) as PendingOtp };
          } catch {
            await this.redis.del(this.redisKey(key));
          }
        }
        continue;
      }

      const pending = this.memoryPending.get(key);
      if (pending) return { key, pending };
    }
    return null;
  }

  private async deletePending(key: string) {
    if (this.redis.isReady) {
      await this.redis.del(this.redisKey(key));
      return;
    }
    this.memoryPending.delete(key);
  }

  private async persistPending(key: string, pending: PendingOtp) {
    const ttlSec = Math.max(1, Math.ceil((pending.expiresAt - Date.now()) / 1000));
    if (this.redis.isReady) {
      await this.redis.set(this.redisKey(key), JSON.stringify(pending), ttlSec);
      return;
    }
    this.memoryPending.set(key, pending);
  }

  private async verifyLocalPendingOrThrow(phone: string, code: string): Promise<boolean> {
    const found = await this.findPending(phone);
    if (!found) {
      throw new BadRequestException(
        'Aucun code demandé pour ce numéro. Veuillez en demander un nouveau.',
      );
    }
    const { key, pending } = found;

    if (pending.attempts >= MAX_ATTEMPTS) {
      await this.deletePending(key);
      throw new BadRequestException(
        'Trop de tentatives. Veuillez demander un nouveau code.',
      );
    }
    if (pending.expiresAt < Date.now()) {
      await this.deletePending(key);
      throw new BadRequestException(
        'Ce code a expiré. Veuillez en demander un nouveau.',
      );
    }
    if (pending.code !== code) {
      pending.attempts += 1;
      await this.persistPending(key, pending);
      throw new BadRequestException('Code invalide. Veuillez réessayer.');
    }

    await this.deletePending(key);
    return true;
  }

  async requestOtp(input: RequestOtpInput): Promise<OtpRequestResult> {
    const phone = this.key(input.phone);

    if (this.smsService.isVerifyConfigured) {
      await this.smsService.sendVerification(phone);
      this.logger.log(`Code OTP envoyé via Twilio Verify pour ${phone}`);
      return {
        phone,
        expiresIn: CODE_TTL_SEC,
        devCode: null,
      };
    }

    const code = this.generateCode();
    await this.storePendingCode(phone, code);
    this.logger.log(`[OTP dev] Code généré pour ${phone} : ${code}`);
    return {
      phone,
      expiresIn: CODE_TTL_SEC,
      devCode: this.isProduction ? null : code,
    };
  }

  async verifyOtp(input: VerifyOtpInput): Promise<boolean> {
    const phone = this.key(input.phone);
    const code = input.code.trim();

    if (this.smsService.testOtpAllowed && code === '123456') {
      return true;
    }

    if (this.smsService.isVerifyConfigured) {
      const approved = await this.smsService.checkVerification(phone, code);
      if (!approved) {
        throw new BadRequestException('Code invalide. Veuillez réessayer.');
      }
      return true;
    }

    return this.verifyLocalPendingOrThrow(phone, code);
  }

  async resetPassword(input: ResetPasswordInput): Promise<boolean> {
    await this.verifyOtp({ phone: input.phone, code: input.code });
    const variants = congoPhoneLookupVariants(input.phone);
    const user = await this.prisma.user.findFirst({
      where: { phone: { in: variants } },
    });
    if (!user) {
      throw new NotFoundException('Aucun compte associé à ce numéro.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(input.password, 10),
        phoneVerified: true,
      },
    });
    return true;
  }

  private generateCode(): string {
    return String(
      Math.floor(
        Math.pow(10, CODE_LENGTH - 1) +
          Math.random() * 9 * Math.pow(10, CODE_LENGTH - 1),
      ),
    );
  }
}
