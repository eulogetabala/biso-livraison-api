/** Limites ciblées via @Throttle sur des routes précises (clé `default` uniquement). */
export const THROTTLE_AUTH = { default: { limit: 10, ttl: 60_000 } };
export const THROTTLE_OTP = { default: { limit: 5, ttl: 60_000 } };
export const THROTTLE_REGISTER = { default: { limit: 5, ttl: 3_600_000 } };
export const THROTTLE_GPS = { default: { limit: 1, ttl: 3_000 } };

/** @SkipThrottle() sans args ne skip que "default". */
export const SKIP_ALL_THROTTLES = { default: true } as const;
