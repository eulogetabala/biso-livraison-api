import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });

    if (!user?.expoPushToken) {
      this.logger.debug(`[Push dev] ${userId} — ${payload.title}: ${payload.body}`);
      return;
    }

    await this.sendToToken(user.expoPushToken, payload);
  }

  async sendToToken(token: string, payload: PushPayload): Promise<void> {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          title: payload.title,
          body: payload.body,
          sound: 'default',
          data: payload.data ?? {},
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`Expo push failed (${response.status}): ${text}`);
        return;
      }

      const result = (await response.json()) as { data?: { status?: string; message?: string }[] };
      const ticket = result.data?.[0];
      if (ticket?.status === 'error') {
        this.logger.warn(`Expo push error: ${ticket.message ?? 'unknown'}`);
      }
    } catch (err) {
      this.logger.warn(`Expo push request failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
