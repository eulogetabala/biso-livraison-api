import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { AppConfig } from '../../config/configuration';
import { renderNotificationEmail } from './mail.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null = null;
  private enabled = false;
  private readonly from: string;

  constructor(configService: ConfigService) {
    const mail = configService.getOrThrow<AppConfig['mail']>('mail');
    this.from = mail.from;

    if (mail.host && mail.user) {
      this.transporter = nodemailer.createTransport({
        host: mail.host,
        port: mail.port,
        secure: mail.secure,
        auth: { user: mail.user, pass: mail.pass },
      });
      this.enabled = true;
    } else {
      this.logger.warn(
        'SMTP non configuré : les emails sont journalisés dans la console. ' +
          'Définissez SMTP_HOST et SMTP_USER pour activer l’envoi réel.',
      );
    }
  }

  /**
   * Envoie un email de notification. Ne lève jamais d'erreur :
   * en l'absence de SMTP configuré, le contenu est loggé en mode développement.
   */
  async sendNotification(
    to: string,
    type: 'ORDER' | 'DELIVERY' | 'PAYMENT',
    subject: string,
    message: string,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    if (!to) {
      this.logger.warn('Impossible d’envoyer un email : destinataire vide');
      return;
    }

    const { text, html } = renderNotificationEmail({
      type,
      subject,
      message,
      data,
    });

    if (!this.enabled || !this.transporter) {
      this.logger.log(`[Email dev] → ${to} | ${subject}\n${text}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Email envoyé à ${to} : ${subject}`);
    } catch (err) {
      this.logger.error(
        `Échec d’envoi de l’email à ${to} : ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
