export type CloudProvider = 'google-drive' | 'google-photos';

export type MediaType = 'image' | 'video';

export type AccountStatus = 'active' | 'expired' | 'revoked' | 'error';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: CloudProvider;
  providerAccountId: string;
  email: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoMetadata {
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
}

export interface Photo {
  id: string;
  connectedAccountId: string;
  providerMediaId: string;
  filename: string;
  mimeType: string;
  mediaType: MediaType;
  sizeBytes: number;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl: string;
  previewUrl: string;
  metadata?: PhotoMetadata;
  // Joined presentation fields
  accountEmail?: string;
  provider?: CloudProvider;
}

export interface Album {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverPhotoUrl?: string;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StorageUsage {
  id: string;
  connectedAccountId: string;
  usedBytes: number;
  quotaBytes?: number;
  availableBytes?: number;
  source: string;
  measuredAt: string;
}

export interface AccountStorageSummary {
  account: ConnectedAccount;
  usage?: StorageUsage;
}

export interface StorageDashboardSummary {
  totalUsedBytes: number;
  totalQuotaBytes: number;
  accounts: AccountStorageSummary[];
  lastUpdated: string;
}

export interface SyncJob {
  id: string;
  connectedAccountId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface GooglePhotosPickerSession {
  id: string;
  sessionId?: string;
  pickerUri: string;
  expireTime: string;
  mediaItemsSet: boolean;
  connectedAccountId: string;
}

export interface GooglePhotosImportResult {
  importedCount: number;
  photos: Photo[];
}

export interface GooglePhotosMediaAccess {
  accessUrl: string;
  mimeType: string;
  filename: string;
  isDirect: boolean;
}

