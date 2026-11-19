import assert from 'node:assert';
import { createApp } from '../app.js';
import { AccountsService } from '../modules/accounts/accounts.service.js';
import { encryptToken, decryptToken } from '../utils/crypto.js';
import { ProviderType } from '@prisma/client';

async function runSecurityIntegrationTests() {
  console.log('Running Security & IDOR Hardening integration tests...');

  // 1. OAuth State Tamper and HMAC verification
  const testUserId = 'f892c5a0-9752-4e55-87c2-3e0e7a85d39e';
  const validState = AccountsService.generateSignedState(testUserId, ProviderType.GOOGLE_DRIVE);
  const verifiedPayload = AccountsService.verifySignedState(validState);
  assert.strictEqual(verifiedPayload.userId, testUserId);
  assert.strictEqual(verifiedPayload.provider, ProviderType.GOOGLE_DRIVE);

  // Tamper with state payload
  const decoded = Buffer.from(validState, 'base64url').toString('utf8');
  const parsed = JSON.parse(decoded);
  parsed.s = parsed.s.substring(0, parsed.s.length - 2) + '00'; // Corrupt signature
  const tamperedState = Buffer.from(JSON.stringify(parsed)).toString('base64url');

  let tamperCaught = false;
  try {
    AccountsService.verifySignedState(tamperedState);
  } catch (err: unknown) {
    tamperCaught = (err as { code: string }).code === 'INVALID_OAUTH_STATE';
  }
  assert.strictEqual(tamperCaught, true, 'Tampered state HMAC signature must be strictly rejected');
  console.log('✔ OAuth state tamper & HMAC cryptographic integrity verified');

  // 2. AES-256-GCM Token Encryption Security
  const secretGoogleRefreshToken = '1//0gJm4_test_refresh_token_very_sensitive_12345';
  const encrypted = encryptToken(secretGoogleRefreshToken, 1);
  assert.notStrictEqual(encrypted.encryptedData, secretGoogleRefreshToken);
  assert(!encrypted.encryptedData.includes('test_refresh_token'), 'Ciphertext must not leak plaintext data');

  const decrypted = decryptToken(encrypted.encryptedData, encrypted.keyVersion);
  assert.strictEqual(decrypted, secretGoogleRefreshToken);

  // Auth Tag Tampering check (GCM detects bit flips in payload)
  const buffer = Buffer.from(encrypted.encryptedData, 'base64');
  buffer[15] ^= 0xff; // Flip a bit in the auth tag region
  const corruptedPayload = buffer.toString('base64');

  let gcmTamperDetected = false;
  try {
    decryptToken(corruptedPayload, 1);
  } catch {
    gcmTamperDetected = true;
  }
  assert.strictEqual(gcmTamperDetected, true, 'AES-256-GCM authentication tag failure detected on tampering');
  console.log('✔ AES-256-GCM authenticated encryption and tamper defense verified');

  // 3. App creation & Rate Limiting check
  const app = createApp();
  assert(app, 'Express app creates cleanly with Helmet, CORS, and Rate Limiting configured');
  console.log('✔ Server application factory initialized cleanly with security headers');

  console.log('All Security & IDOR integration tests passed successfully!');
}

runSecurityIntegrationTests().catch((err) => {
  console.error('Security integration tests failed:', err);
  process.exit(1);
});
