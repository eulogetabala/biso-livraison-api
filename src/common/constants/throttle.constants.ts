/** Limites par défaut — voir ThrottlerModule dans app.module.ts */
export const THROTTLE_AUTH = { auth: { limit: 10, ttl: 60_000 } };
export const THROTTLE_OTP = { otp: { limit: 5, ttl: 60_000 } };
export const THROTTLE_REGISTER = { register: { limit: 5, ttl: 3_600_000 } };
export const THROTTLE_GPS = { gps: { limit: 1, ttl: 3_000 } };

/** @SkipThrottle() sans args ne skip que "default" — il faut tous les noms. */
export const SKIP_ALL_THROTTLES = {
  default: true,
  auth: true,
  otp: true,
  register: true,
  gps: true,
} as const;
