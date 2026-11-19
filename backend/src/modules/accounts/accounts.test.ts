import assert from 'node:assert';
import { AccountsService } from './accounts.service.js';
import { ProviderType } from '@prisma/client';

async function runAccountsUnitTests() {
  console.log('Running Accounts & OAuth state unit tests...');

  const userId = 'usr-test-456';

  // Test 1: Signed OAuth state generation & verification
  const state = AccountsService.generateSignedState(userId, ProviderType.GOOGLE_DRIVE);
  assert.ok(state.length > 20, 'State string must be non-empty');

  const verified = AccountsService.verifySignedState(state);
  assert.strictEqual(verified.userId, userId, 'Verified state userId must match');
  assert.strictEqual(verified.provider, ProviderType.GOOGLE_DRIVE, 'Verified state provider must match');
  console.log('✔ OAuth state HMAC signing & verification passed');

  // Test 2: Tampered state rejection
  const tamperedState = state.slice(0, -4) + 'abcd';
  assert.throws(
    () => {
      AccountsService.verifySignedState(tamperedState);
    },
    (err: unknown) => {
      return (err as { code?: string }).code === 'INVALID_OAUTH_STATE';
    },
    'Tampered state must throw INVALID_OAUTH_STATE'
  );
  console.log('✔ Tampered OAuth state rejection passed');

  // Test 3: Authorization URL construction
  const { authUrl, state: returnedState } = AccountsService.createAuthorizationUrl(userId, ProviderType.GOOGLE_DRIVE);
  assert.ok(authUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), 'URL must target Google OAuth endpoint');
  assert.ok(authUrl.includes('access_type=offline'), 'URL must request offline access for refresh tokens');
  assert.ok(authUrl.includes('prompt=consent'), 'URL must force consent prompt');
  assert.ok(authUrl.includes('drive.readonly'), 'URL must include drive scope');
  assert.strictEqual(AccountsService.verifySignedState(returnedState).userId, userId);
  console.log('✔ Google OAuth authorization URL construction passed');

  console.log('All Accounts unit tests passed successfully!');
}

runAccountsUnitTests().catch((err) => {
  console.error('Accounts test failed:', err);
  process.exit(1);
});
