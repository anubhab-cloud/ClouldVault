import { MediaType } from '@prisma/client';

export interface NormalizedMediaMetadata {
  width?: number;
  height?: number;
  aspectRatio?: number;
  cameraModel?: string;
  focalLength?: number;
  exposureTime?: string;
  iso?: number;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  durationSeconds?: number;
  baseUrl?: string;
  baseUrlExpiresAt?: number;
}

export interface NormalizedMediaItem {
  providerMediaId: string;
  filename: string;
  mimeType: string;
  mediaType: MediaType;
  sizeBytes: bigint;
  capturedAt: Date;
  thumbnailUrl: string;
  previewUrl: string;
  metadata?: NormalizedMediaMetadata;
}

export interface ProviderMediaListResult {
  items: NormalizedMediaItem[];
  nextPageToken?: string;
}

export interface AuthorizedMediaAccess {
  url: string;
  headers?: Record<string, string>;
  expiresAt?: Date;
}

export interface CloudProviderDriver {
  listMedia(options?: { pageToken?: string; pageSize?: number }): Promise<ProviderMediaListResult>;
  getAuthorizedMediaAccess(providerMediaId: string): Promise<AuthorizedMediaAccess>;
  refreshAccessToken(): Promise<string>;
}
