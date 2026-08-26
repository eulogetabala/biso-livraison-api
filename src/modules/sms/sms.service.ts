import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { AppConfig } from '../../config/configuration';

/**
 * Service d'accès à Twilio.
 *
 * - OTP : via Twilio Verify (pas de numéro émetteur requis).
 * - SMS génériques (optionnel) : via Messages.create, nécessite un numéro
 *   Twilio (TWILIO_FROM_NUMBER).
 *
 * Si les credentials ne sont pas configurés, les appels sont journalisés dans
 * la console — utile en développement.
 */
@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private readonly client: twilio.Twilio | null = null;
  private readonly fromNumber: string;
  private readonly verifyServiceSid: string;
  private readonly verifyFriendlyName: string;
  private readonly allowTestOtp: boolean;

  constructor(configService: ConfigService) {
    const twilioConfig = configService.getOrThrow<AppConfig['twilio']>('twilio');
    this.fromNumber = twilioConfig.fromNumber;
    this.verifyServiceSid = twilioConfig.verifyServiceSid;
    this.verifyFriendlyName = twilioConfig.verifyFriendlyName;
    this.allowTestOtp = twilioConfig.allowTestOtp;

    if (twilioConfig.accountSid && twilioConfig.authToken) {
      this.client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
    }

    if (this.client && this.verifyServiceSid) {
      this.logger.log(
        `Twilio Verify configuré (service : ${this.verifyFriendlyName})`,
      );
    } else {
      this.logger.warn(
        'Twilio Verify non configuré : les OTP seront journalisés dans la console. ' +
          'Définissez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_VERIFY_SERVICE_SID.',
      );
    }
  }

  /**
   * Synchronise le nom convivial du service Verify (celui affiché dans le SMS)
   * avec TWILIO_VERIFY_FRIENDLY_NAME. Sans effet si le nom est déjà à jour.
   */
  async onModuleInit(): Promise<void> {
    if (!this.client || !this.verifyServiceSid) return;
    try {
      const service = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .fetch();
      if (service.friendlyName !== this.verifyFriendlyName) {
        await this.client.verify.v2
          .services(this.verifyServiceSid)
          .update({ friendlyName: this.verifyFriendlyName });
        this.logger.log(
          `Nom du service Verify mis à jour : ${this.verifyFriendlyName}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Impossible de synchroniser le nom du service Verify : ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  get isVerifyConfigured(): boolean {
    return !!this.client && !!this.verifyServiceSid;
  }

  /** Autorise le code test "123456" (dev uniquement). */
  get testOtpAllowed(): boolean {
    return this.allowTestOtp;
  }

  /**
   * Déclenche l'envoi d'un code OTP via Twilio Verify (SMS ou WhatsApp selon
   * la configuration du service). Ne lève pas d'erreur en mode dev.
   */
  async sendVerification(phone: string): Promise<void> {
    if (!this.client || !this.verifyServiceSid) {
      this.logger.log(`[OTP dev] Demande de code pour ${phone}`);
      return;
    }

    try {
      const verification = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({ to: this.formatE164(phone), channel: 'sms' });
      this.logger.log(`OTP envoyé à ${phone} (sid ${verification.sid})`);
    } catch (err) {
      this.logger.error(
        `Échec d'envoi de l'OTP à ${phone} : ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Vérifie le code saisi auprès de Twilio Verify.
   * Retourne true si le code est correct.
   */
  async checkVerification(phone: string, code: string): Promise<boolean> {
    if (this.allowTestOtp && code.trim() === '123456') {
      return true;
    }

    if (!this.client || !this.verifyServiceSid) {
      return false;
    }

    try {
      const check = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: this.formatE164(phone),
          code: code.trim(),
        });
      return check.status === 'approved';
    } catch (err) {
      this.logger.error(
        `Échec de vérification de l'OTP pour ${phone} : ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return false;
    }
  }

  /**
   * Envoie un SMS générique (optionnel). Nécessite un numéro Twilio
   * (TWILIO_FROM_NUMBER). Ne lève jamais d'erreur.
   */
  async sendSms(to: string, body: string): Promise<void> {
    if (!to) {
      this.logger.warn('Impossible d’envoyer un SMS : destinataire vide');
      return;
    }

    if (!this.client || !this.fromNumber) {
      this.logger.log(`[SMS dev] → ${to} | ${body}`);
      return;
    }

    try {
      const message = await this.client.messages.create({
        to: this.formatE164(to),
        from: this.fromNumber,
        body,
      });
      this.logger.log(`SMS envoyé à ${to} (sid ${message.sid})`);
    } catch (err) {
      this.logger.error(
        `Échec d’envoi du SMS à ${to} : ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** Normalise un numéro au format E.164 (requis par Twilio). */
  private formatE164(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('242')) return `+${digits}`;
    return `+242${digits}`;
  }
}
