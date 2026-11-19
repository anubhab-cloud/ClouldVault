import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Returns encryption key buffer based on key version
 */
function getKeyForVersion(version: number): Buffer {
  if (version === 1) {
    return Buffer.from(env.ENCRYPTION_KEY_V1.slice(0, 64), 'hex');
  }
  throw new Error(`Unsupported encryption key version: ${version}`);
}

export interface EncryptedPayload {
  encryptedData: string; // Base64 encoded: IV (12) + Tag (16) + Ciphertext
  keyVersion: number;
}

/**
 * Encrypt sensitive plain text (e.g. Google OAuth refresh token) using AES-256-GCM
 */
export function encryptToken(plainText: string, keyVersion = env.CURRENT_KEY_VERSION): EncryptedPayload {
  const key = getKeyForVersion(keyVersion);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + EncryptedData into a single buffer
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return {
    encryptedData: combined.toString('base64'),
    keyVersion,
  };
}

/**
 * Decrypt sensitive cipher text using AES-256-GCM and verify integrity
 */
export function decryptToken(encryptedDataBase64: string, keyVersion: number): string {
  const key = getKeyForVersion(keyVersion);
  const combined = Buffer.from(encryptedDataBase64, 'base64');

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Malformed encrypted payload');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
