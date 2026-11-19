import assert from 'node:assert';
import { GoogleDriveClient, GoogleDriveFileRaw } from './drive.client.js';
import { MediaType } from '@prisma/client';

async function runDriveUnitTests() {
  console.log('Running Google Drive Driver unit tests...');

  const client = new GoogleDriveClient('mock-refresh-token');

  // Test 1: Image normalization with full EXIF metadata
  const sampleDriveImage: GoogleDriveFileRaw = {
    id: 'sample-drive-file-123',
    name: 'Glacier_National_Park.jpg',
    mimeType: 'image/jpeg',
    size: '5242880',
    createdTime: '2026-06-15T10:00:00Z',
    thumbnailLink: 'https://drive.google.com/thumbnail/sample',
    webContentLink: 'https://drive.google.com/download/sample',
    imageMediaMetadata: {
      width: 4000,
      height: 3000,
      cameraMake: 'Sony',
      cameraModel: 'ILCE-7M4',
      focalLength: 50,
      exposureTime: 0.002, // 1/500s
      isoSpeed: 100,
      time: '2026-06-14T14:30:00Z',
      location: {
        latitude: 48.7596,
        longitude: -113.787,
      },
    },
  };

  const normalizedImage = client.normalizeDriveFile(sampleDriveImage);
  assert.strictEqual(normalizedImage.providerMediaId, 'sample-drive-file-123');
  assert.strictEqual(normalizedImage.filename, 'Glacier_National_Park.jpg');
  assert.strictEqual(normalizedImage.mediaType, MediaType.IMAGE);
  assert.strictEqual(normalizedImage.sizeBytes, 5242880n);
  assert.strictEqual(normalizedImage.capturedAt.toISOString(), new Date('2026-06-14T14:30:00Z').toISOString());
  assert.strictEqual(normalizedImage.metadata?.cameraModel, 'ILCE-7M4');
  assert.strictEqual(normalizedImage.metadata?.focalLength, 50);
  assert.strictEqual(normalizedImage.metadata?.exposureTime, '1/500s');
  assert.strictEqual(normalizedImage.metadata?.iso, 100);
  assert.strictEqual(normalizedImage.metadata?.latitude, 48.7596);
  assert.strictEqual(normalizedImage.metadata?.aspectRatio, 1.33);
  console.log('✔ Google Drive photo EXIF normalization passed');

  // Test 2: Video normalization with duration calculation
  const sampleDriveVideo: GoogleDriveFileRaw = {
    id: 'sample-drive-video-456',
    name: 'Mountain_Stream.mp4',
    mimeType: 'video/mp4',
    size: '52428800',
    createdTime: '2026-07-20T12:00:00Z',
    videoMediaMetadata: {
      width: 1920,
      height: 1080,
      durationMillis: '45000', // 45 seconds
    },
  };

  const normalizedVideo = client.normalizeDriveFile(sampleDriveVideo);
  assert.strictEqual(normalizedVideo.mediaType, MediaType.VIDEO);
  assert.strictEqual(normalizedVideo.metadata?.durationSeconds, 45);
  assert.strictEqual(normalizedVideo.metadata?.aspectRatio, 1.78);
  console.log('✔ Google Drive video normalization & duration passed');

  console.log('All Google Drive unit tests passed successfully!');
}

runDriveUnitTests().catch((err) => {
  console.error('Drive test failed:', err);
  process.exit(1);
});
