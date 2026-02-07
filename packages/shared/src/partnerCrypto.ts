import crypto from 'crypto';
import { env } from '@ujuz/config';

/**
 * Stable SHA-256 hex.
 */
export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Partner key hashing (store only hashed values in DB).
 * - If PARTNER_KEY_HASH_SALT is set, we prefix with salt.
 */
export function hashPartnerKey(rawKey: string): string {
  const salt = env.PARTNER_KEY_HASH_SALT ?? '';
  // include a delimiter so salt collisions don't merge with key bytes
  return sha256Hex(`${salt}::${rawKey}`);
}

/**
 * URL-safe random code: <prefix>_<base64url>
 */
export function randomCode(prefix: string): string {
  const rand = crypto.randomBytes(12).toString('base64url'); // 16-ish chars
  return `${prefix}_${rand}`;
}
