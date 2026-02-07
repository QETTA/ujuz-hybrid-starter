import { createHash, randomBytes } from 'crypto';

export function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

export function randomCode(prefix: string, bytes = 5) {
  return `${prefix}_${randomBytes(bytes).toString('hex')}`;
}
