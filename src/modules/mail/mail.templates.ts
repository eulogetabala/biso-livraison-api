export type NotificationMailKind = 'ORDER' | 'DELIVERY' | 'PAYMENT';

export interface NotificationMailData {
  type: NotificationMailKind;
  subject: string;
  message: string;
  data: Record<string, unknown>;
}

const KIND_LABEL: Record<NotificationMailKind, string> = {
  ORDER: '📦 Commande',
  DELIVERY: '🛵 Livraison',
  PAYMENT: '💳 Paiement',
};

export function renderNotificationEmail(input: NotificationMailData): {
  text: string;
  html: string;
} {
  const { type, subject, message, data } = input;
  const label = KIND_LABEL[type];
  const orderId = typeof data.orderId === 'string' ? data.orderId : undefined;
  const amount = typeof data.amount === 'number' ? data.amount : undefined;
  const appName = 'Biso Livraison';

  const metaRows = [
    orderId ? `<tr><td>Commande</td><td>#${orderId.slice(0, 8)}</td></tr>` : '',
    amount !== undefined
      ? `<tr><td>Montant</td><td>${amount.toFixed(2)} €</td></tr>`
      : '',
  ].join('');

  const text = [
    `${appName} — ${subject}`,
    '',
    message,
    '',
    orderId ? `Commande : ${orderId}` : '',
    amount !== undefined ? `Montant : ${amount.toFixed(2)} €` : '',
    '',
    'Merci de votre confiance,',
    `L'équipe ${appName}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
          <tr>
            <td style="background:#111827;padding:20px 28px">
              <span style="color:#ffffff;font-size:18px;font-weight:700">${appName}</span>
              <span style="color:#9ca3af;font-size:12px;margin-left:8px">${label}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px">
              <h1 style="margin:0 0 12px;font-size:20px;color:#111827">${subject}</h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151">${message}</p>
              ${
                metaRows
                  ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border-radius:12px;padding:12px 16px">
                       ${metaRows}
                     </table>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #e5e7eb">
              <p style="margin:0;font-size:12px;color:#6b7280">
                Merci de votre confiance — L’équipe ${appName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { text, html };
}
