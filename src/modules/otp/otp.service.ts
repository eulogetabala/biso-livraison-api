import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SmsService } from '../sms/sms.service';
import { RequestOtpInput } from './dto/request-otp.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { OtpRequestResult } from './models/otp-request-result.model';

const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

type PendingOtp = {
  code: string;
  expiresAt: number;
  attempts: number;
};

/**
 * Flux OTP basé sur Twilio Verify.
 *
 * Quand Verify est configuré, Twilio génère et envoie le code lui-même (SMS)
 * et c'est Twilio qui le vérifie. En l'absence de config (développement),
 * un fallback local génère un code, le retourne dans `devCode` et le vérifie
 * en mémoire.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly pending = new Map<string, PendingOtp>();

  constructor(private readonly smsService: SmsService) {}

  /** Normalise le numéro en clé interne (E.164). */
  private key(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('242') ? `+${digits}` : `+242${digits}`;
  }

  /**
   * Déclenche l'envoi d'un code OTP.
   * - Verify configuré : envoi via Twilio, pas de code connu côté backend.
   * - Verify non configuré : code généré localement et renvoyé (devCode).
   */
  async requestOtp(input: RequestOtpInput): Promise<OtpRequestResult> {
    const phone = this.key(input.phone);

    if (this.smsService.isVerifyConfigured) {
      await this.smsService.sendVerification(phone);
      this.logger.log(`Code OTP envoyé via Twilio Verify pour ${phone}`);
      return {
        phone,
        expiresIn: Math.floor(CODE_TTL_MS / 1000),
        devCode: null,
      };
    }

    // Fallback développement : code local retourné pour l'UI.
    const code = this.generateCode();
    this.pending.set(phone, {
      code,
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
    });
    this.logger.log(`[OTP dev] Code généré pour ${phone} : ${code}`);
    return {
      phone,
      expiresIn: Math.floor(CODE_TTL_MS / 1000),
      devCode: code,
    };
  }

  /**
   * Vérifie le code saisi.
   * - Verify configuré : délégation à Twilio (le code est à usage unique).
   * - Sinon : vérification locale du fallback.
   */
  async verifyOtp(input: VerifyOtpInput): Promise<boolean> {
    const phone = this.key(input.phone);
    const code = input.code.trim();

    if (this.smsService.isVerifyConfigured) {
      if (this.smsService.testOtpAllowed && code === '123456') {
        return true;
      }
      const approved = await this.smsService.checkVerification(phone, code);
      if (!approved) {
        throw new BadRequestException('Code invalide. Veuillez réessayer.');
      }
      return true;
    }

    // Vérification locale (fallback dev).
    const pending = this.pending.get(phone);
    if (!pending) {
      throw new BadRequestException(
        'Aucun code demandé pour ce numéro. Veuillez en demander un nouveau.',
      );
    }
    if (pending.attempts >= MAX_ATTEMPTS) {
      this.pending.delete(phone);
      throw new BadRequestException(
        'Trop de tentatives. Veuillez demander un nouveau code.',
      );
    }
    if (pending.expiresAt < Date.now()) {
      this.pending.delete(phone);
      throw new BadRequestException(
        'Ce code a expiré. Veuillez en demander un nouveau.',
      );
    }
    if (pending.code !== code) {
      pending.attempts += 1;
      throw new BadRequestException('Code invalide. Veuillez réessayer.');
    }

    this.pending.delete(phone);
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
