import assert from 'node:assert';
import { GooglePhotosPickerClient } from './photos-picker.client.js';
import { MediaType } from '@prisma/client';

async function runPhotosPickerUnitTests() {
  console.log('Running Google Photos Picker Client unit tests...');

  const client = new GooglePhotosPickerClient('1//mock-refresh-token');

  // Test 1: Session creation
  const session = await client.createPickerSession();
  assert(session.id, 'Session must have an ID');
  assert(session.pickerUri.includes('https://photos.google.com/picker/'), 'Session pickerUri must point to Google Photos picker');
  assert(new Date(session.expireTime).getTime() > Date.now(), 'expireTime must be in the future');
  console.log('✔ Google Photos Picker session creation passed');

  // Test 2: Polling session status
  const sessionStatus = await client.getPickerSession(session.id);
  assert.strictEqual(sessionStatus.id, session.id);
  assert.strictEqual(sessionStatus.mediaItemsSet, true, 'Mock session should mark mediaItemsSet as true when polled');
  console.log('✔ Google Photos Picker session polling passed');

  // Test 3: Media normalization & retrieval
  const mediaItems = await client.listSessionMediaItems(session.id);
  assert(mediaItems.length >= 2, 'Should return picked media items');

  const photoItem = mediaItems.find((i) => i.mediaType === MediaType.IMAGE);
  assert(photoItem, 'Should find at least one photo item');
  assert(photoItem.providerMediaId.startsWith('gp-mock-item-'), 'Photo providerMediaId matches expected format');
  assert.strictEqual(photoItem.mimeType, 'image/jpeg');
  assert(photoItem.metadata?.baseUrl, 'Photo metadata must retain Google Photos baseUrl');
  assert(photoItem.metadata?.baseUrlExpiresAt, 'Photo metadata must track baseUrl expiration');
  assert(photoItem.thumbnailUrl?.includes('=w600-h600'), 'Photo thumbnail link includes resize parameters');

  const videoItem = mediaItems.find((i) => i.mediaType === MediaType.VIDEO);
  assert(videoItem, 'Should find at least one video item');
  assert.strictEqual(videoItem.mimeType, 'video/mp4');
  console.log('✔ Google Photos media item normalization & access TTL passed');

  console.log('All Google Photos Picker unit tests passed successfully!');
}

runPhotosPickerUnitTests().catch((err) => {
  console.error('Photos Picker test suite failed:', err);
  process.exit(1);
});
