/**
 * Mobile Congo pour Twilio / base : +24206XXXXXXX
 * (indicatif +242, puis 9 chiffres nationaux incluant le 0 initial).
 */
export const CONGO_MOBILE_E164_REGEX = /^\+2420[6]\d{7}$/;

/**
 * Normalise un numéro congolais au format attendu par Twilio et la base seed.
 * Ex. 06 123 45 67 → +242061234567
 */
export function normalizePhoneE164(phone: string): string {
  if (!phone?.trim()) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('242242')) digits = digits.slice(3);
  else if (digits.startsWith('242')) return `+${digits}`;
  if (!digits.startsWith('0')) digits = `0${digits}`;
  return `+242${digits}`;
}

/** Vérifie qu'un numéro normalisé est un mobile congolais valide. */
export function isValidCongoMobileE164(phone: string): boolean {
  return CONGO_MOBILE_E164_REGEX.test(normalizePhoneE164(phone));
}

/**
 * Retourne le numéro normalisé ou une clé d'erreur (`empty`, `length`, `prefix`, `format`).
 */
export function validateCongoMobilePhone(
  phone: string,
): { ok: true; e164: string } | { ok: false; reason: 'empty' | 'length' | 'prefix' | 'format' } {
  const e164 = normalizePhoneE164(phone);
  if (!e164) return { ok: false, reason: 'empty' };
  const national = e164.slice(4);
  if (national.length !== 9) return { ok: false, reason: 'length' };
  if (!national.startsWith('06')) return { ok: false, reason: 'prefix' };
  if (!CONGO_MOBILE_E164_REGEX.test(e164)) return { ok: false, reason: 'format' };
  return { ok: true, e164 };
}

/** Variantes possibles en base (+24206… canonique et +2426… legacy). */
export function congoPhoneLookupVariants(phone: string): string[] {
  const canonical = normalizePhoneE164(phone);
  if (!canonical) return [];
  const national = canonical.slice(4);
  const legacy = `+242${national.slice(1)}`;
  return [...new Set([canonical, legacy, phone.trim()])];
}
