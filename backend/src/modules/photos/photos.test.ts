import assert from 'node:assert';
import { PhotosService } from './photos.service.js';

async function runPhotosUnitTests() {
  console.log('Running Photos & Gallery Keyset Pagination unit tests...');

  // Test 1: Cursor encoding and decoding
  const testDate = new Date('2026-11-18T14:30:00.000Z');
  const testId = 'photo-uuid-12345';

  const cursor = PhotosService.encodeCursor(testDate, testId);
  assert.ok(typeof cursor === 'string', 'Cursor must be a base64url string');

  const decoded = PhotosService.decodeCursor(cursor);
  assert.ok(decoded !== null, 'Decoded cursor must not be null');
  assert.strictEqual(decoded?.id, testId, 'Decoded photo ID must match');
  assert.strictEqual(decoded?.capturedAt, testDate.toISOString(), 'Decoded capturedAt timestamp must match');
  console.log('✔ Keyset cursor encoding & decoding passed');

  // Test 2: Invalid cursor handling
  const invalidCursor = 'not-a-valid-base64url-payload';
  const invalidResult = PhotosService.decodeCursor(invalidCursor);
  assert.strictEqual(invalidResult, null, 'Invalid cursor must return null safely');
  console.log('✔ Corrupted cursor graceful fallback passed');

  console.log('All Photos unit tests passed successfully!');
}

runPhotosUnitTests().catch((err) => {
  console.error('Photos test failed:', err);
  process.exit(1);
});
