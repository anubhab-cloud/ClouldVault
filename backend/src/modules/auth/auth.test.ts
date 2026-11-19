import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { encryptToken, decryptToken } from '../../utils/crypto.js';

async function runAuthUnitTests() {
  console.log('Running Auth & Crypto unit tests...');

  // Test 1: Password hashing and verification
  const password = 'SuperSecretPassword123!';
  const hash = await bcrypt.hash(password, 10);
  assert.strictEqual(await bcrypt.compare(password, hash), true, 'Bcrypt password comparison must succeed');
  assert.strictEqual(await bcrypt.compare('WrongPassword', hash), false, 'Bcrypt invalid password must fail');
  console.log('✔ Bcrypt hashing & verification passed');

  // Test 2: JWT Access Token generation & verification
  const userId = 'usr-test-123';
  const email = 'test@cloudvault.app';
  const accessToken = jwt.sign({ sub: userId, email }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as { sub: string; email: string };
  assert.strictEqual(decoded.sub, userId, 'JWT sub claim must match userId');
  assert.strictEqual(decoded.email, email, 'JWT email claim must match email');
  console.log('✔ JWT Access token signing & decoding passed');

  // Test 3: AES-256-GCM OAuth Token Encryption & Decryption
  const sampleGoogleRefreshToken = '1//04test_google_refresh_token_string_example_12345';
  const encryptedPayload = encryptToken(sampleGoogleRefreshToken, 1);
  assert.strictEqual(encryptedPayload.keyVersion, 1, 'Key version must be preserved');
  assert.notStrictEqual(encryptedPayload.encryptedData, sampleGoogleRefreshToken, 'Ciphertext must not equal plain text');

  const decryptedToken = decryptToken(encryptedPayload.encryptedData, encryptedPayload.keyVersion);
  assert.strictEqual(decryptedToken, sampleGoogleRefreshToken, 'Decrypted token must exactly match original');
  console.log('✔ AES-256-GCM token encryption & decryption roundtrip passed');

  console.log('All tests passed successfully!');
}

runAuthUnitTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
