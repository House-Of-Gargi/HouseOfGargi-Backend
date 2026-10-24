import bcrypt from 'bcryptjs';

export const DEFAULT_ADMIN_PASSWORD = '12345678';
const SALT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt with 12 salt rounds
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Compare plain text password against stored bcrypt hash.
 * If no hash exists in database (NULL / column missing), defaults to checking '12345678'.
 */
export async function verifyPassword(plainText: string, storedHash?: string | null): Promise<boolean> {
  if (!storedHash) {
    return plainText === DEFAULT_ADMIN_PASSWORD;
  }
  return bcrypt.compare(plainText, storedHash);
}

/**
 * Returns bcrypt hash for the default administrator password '12345678'
 */
export async function getDefaultPasswordHash(): Promise<string> {
  return hashPassword(DEFAULT_ADMIN_PASSWORD);
}
