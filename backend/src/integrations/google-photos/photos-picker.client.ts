import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MediaType } from '@prisma/client';
import { NormalizedMediaItem } from '../provider.interface.js';

export interface GooglePhotosPickerSessionRaw {
  id: string;
  pickerUri: string;
  expireTime: string;
  mediaItemsSet: boolean;
}

export interface GooglePhotosMediaItemRaw {
  id: string;
  type?: 'PHOTO' | 'VIDEO';
  mediaFile?: {
    baseUrl: string;
    filename: string;
    mimeType: string;
    maxHeightPercentage?: number;
    maxWidthPercentage?: number;
  };
  createTime?: string;
}

// In-memory mock session store for development & tests
const mockSessionsStore = new Map<string, {
  session: GooglePhotosPickerSessionRaw;
  createdAt: number;
}>();

export class GooglePhotosPickerClient {
  private refreshToken: string;
  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor(refreshToken: string, initialAccessToken?: string) {
    this.refreshToken = refreshToken;
    this.accessToken = initialAccessToken;
  }

  /**
   * Refreshes access token with Google OAuth token endpoint
   */
  public async refreshAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && !this.refreshToken.startsWith('1//mock') && env.GOOGLE_CLIENT_SECRET !== 'dummy-dev-client-secret') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to refresh Google Photos access token:', errorText);
        throw new Error('Google Photos access token refresh failed');
      }

      const data = (await response.json()) as { access_token: string; expires_in?: number };
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      return this.accessToken!;
    } else {
      // Mock access token for dev mode
      this.accessToken = `mock-photos-token-${Date.now()}`;
      this.tokenExpiresAt = Date.now() + 3600 * 1000;
      return this.accessToken;
    }
  }

  /**
   * Create an interactive Google Photos Picker session
   */
  public async createPickerSession(): Promise<GooglePhotosPickerSessionRaw> {
    const accessToken = await this.refreshAccessToken();

    if (!this.refreshToken.startsWith('1//mock') && env.GOOGLE_CLIENT_SECRET !== 'dummy-dev-client-secret') {
      const response = await fetch('https://photospicker.googleapis.com/v1/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to create Photos Picker session:', errorText);
        throw new Error(`Google Photos Picker API error: ${response.status}`);
      }

      const session = (await response.json()) as GooglePhotosPickerSessionRaw;
      return session;
    } else {
      // Simulated Photos Picker Session for development & offline environments
      const mockSessionId = `photos-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const expireTime = new Date(Date.now() + 3600 * 1000).toISOString();
      const mockSession: GooglePhotosPickerSessionRaw = {
        id: mockSessionId,
        pickerUri: `https://photos.google.com/picker/mock-picker-session?id=${mockSessionId}`,
        expireTime,
        mediaItemsSet: false,
      };

      mockSessionsStore.set(mockSessionId, {
        session: mockSession,
        createdAt: Date.now(),
      });

      return mockSession;
    }
  }

  /**
   * Check status of a picker session
   */
  public async getPickerSession(sessionId: string): Promise<GooglePhotosPickerSessionRaw> {
    const accessToken = await this.refreshAccessToken();

    if (!this.refreshToken.startsWith('1//mock') && env.GOOGLE_CLIENT_SECRET !== 'dummy-dev-client-secret') {
      const response = await fetch(`https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(sessionId)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to query Photos Picker session:', errorText);
        throw new Error(`Google Photos Picker API error: ${response.status}`);
      }

      return (await response.json()) as GooglePhotosPickerSessionRaw;
    } else {
      const stored = mockSessionsStore.get(sessionId);
      if (stored) {
        // Automatically mark as mediaItemsSet: true for dev ease
        stored.session.mediaItemsSet = true;
        return stored.session;
      }

      return {
        id: sessionId,
        pickerUri: `https://photos.google.com/picker/mock-picker-session?id=${sessionId}`,
        expireTime: new Date(Date.now() + 3600 * 1000).toISOString(),
        mediaItemsSet: true,
      };
    }
  }

  /**
   * Retrieve selected media items from an active session
   */
  public async listSessionMediaItems(sessionId: string): Promise<NormalizedMediaItem[]> {
    const accessToken = await this.refreshAccessToken();

    if (!this.refreshToken.startsWith('1//mock') && env.GOOGLE_CLIENT_SECRET !== 'dummy-dev-client-secret') {
      const response = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${encodeURIComponent(sessionId)}&pageSize=100`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to query Photos Picker media items:', errorText);
        throw new Error(`Google Photos Picker API error: ${response.status}`);
      }

      const data = (await response.json()) as { mediaItems?: GooglePhotosMediaItemRaw[] };
      const rawItems = data.mediaItems || [];

      return rawItems.map((item) => this.normalizePickerItem(item));
    } else {
      // Return simulated picked media items for dev mode
      const now = Date.now();
      const mockItems: GooglePhotosMediaItemRaw[] = [
        {
          id: `gp-mock-item-1-${now}`,
          type: 'PHOTO',
          mediaFile: {
            baseUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80',
            filename: 'Tropical_Paradise_Coast.jpg',
            mimeType: 'image/jpeg',
          },
          createTime: new Date(now - 86400000 * 2).toISOString(),
        },
        {
          id: `gp-mock-item-2-${now}`,
          type: 'PHOTO',
          mediaFile: {
            baseUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop&q=80',
            filename: 'Starry_Night_Peaks.jpg',
            mimeType: 'image/jpeg',
          },
          createTime: new Date(now - 86400000 * 5).toISOString(),
        },
        {
          id: `gp-mock-item-3-${now}`,
          type: 'VIDEO',
          mediaFile: {
            baseUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            filename: 'Ocean_Drone_Sweep.mp4',
            mimeType: 'video/mp4',
          },
          createTime: new Date(now - 86400000 * 8).toISOString(),
        },
      ];

      return mockItems.map((item) => this.normalizePickerItem(item));
    }
  }

  /**
   * Normalize Google Photos Picker item into domain NormalizedMediaItem
   */
  private normalizePickerItem(item: GooglePhotosMediaItemRaw): NormalizedMediaItem {
    const isVideo = item.type === 'VIDEO' || item.mediaFile?.mimeType.startsWith('video/');
    const baseUrl = item.mediaFile?.baseUrl || '';
    const filename = item.mediaFile?.filename || `photos_${item.id}.jpg`;
    const mimeType = item.mediaFile?.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');

    // Default dimensions
    const width = 3840;
    const height = 2160;

    return {
      providerMediaId: item.id,
      filename,
      mimeType,
      mediaType: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
      sizeBytes: BigInt(3500000), // Estimated byte size for picker items
      capturedAt: item.createTime ? new Date(item.createTime) : new Date(),
      metadata: {
        width,
        height,
        aspectRatio: width / height,
        cameraModel: 'Google Photos Selected Media',
        baseUrl,
        baseUrlExpiresAt: Date.now() + 60 * 60 * 1000, // 60 min TTL per Google policy
      },
      thumbnailUrl: baseUrl ? (isVideo ? baseUrl : `${baseUrl}=w600-h600`) : '',
      previewUrl: baseUrl ? `${baseUrl}=d` : '',
    };
  }
}
