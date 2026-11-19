import { CloudProviderDriver, ProviderMediaListResult, NormalizedMediaItem, AuthorizedMediaAccess } from '../provider.interface.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { MediaType } from '@prisma/client';

export interface GoogleDriveFileRaw {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    rotation?: number;
    time?: string;
    cameraMake?: string;
    cameraModel?: string;
    exposureTime?: number;
    aperture?: number;
    flashUsed?: boolean;
    focalLength?: number;
    isoSpeed?: number;
    location?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
  };
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
}

export class GoogleDriveClient implements CloudProviderDriver {
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

    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && !this.refreshToken.startsWith('1//mock')) {
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
        logger.error('Failed to refresh Google Drive access token:', errorText);
        throw new Error('Google Drive access token refresh failed');
      }

      const data = (await response.json()) as { access_token: string; expires_in?: number };
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      return this.accessToken!;
    } else {
      // Mock access token for dev mode
      this.accessToken = `mock-access-token-${Date.now()}`;
      this.tokenExpiresAt = Date.now() + 3600 * 1000;
      return this.accessToken;
    }
  }

  /**
   * Query photos and videos from Google Drive
   */
  public async listMedia(options: { pageToken?: string; pageSize?: number } = {}): Promise<ProviderMediaListResult> {
    const accessToken = await this.refreshAccessToken();
    const pageSize = options.pageSize || 50;

    if (!this.refreshToken.startsWith('1//mock') && env.GOOGLE_CLIENT_SECRET !== 'dummy-dev-client-secret') {
      const q = "(mimeType contains 'image/' or mimeType contains 'video/') and trashed = false";
      const fields = 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, thumbnailLink, webContentLink, imageMediaMetadata, videoMediaMetadata)';

      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', q);
      url.searchParams.set('pageSize', pageSize.toString());
      url.searchParams.set('fields', fields);
      url.searchParams.set('orderBy', 'createdTime desc');
      if (options.pageToken) {
        url.searchParams.set('pageToken', options.pageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Drive files.list failed:', errorText);
        throw new Error(`Google Drive API error: ${response.status}`);
      }

      const data = (await response.json()) as { files?: GoogleDriveFileRaw[]; nextPageToken?: string };
      const files: GoogleDriveFileRaw[] = data.files || [];

      return {
        items: files.map((file) => this.normalizeDriveFile(file)),
        nextPageToken: data.nextPageToken,
      };
    } else {
      // Simulated Drive files for development testing
      const mockFiles: GoogleDriveFileRaw[] = [
        {
          id: `drive-mock-file-1-${Date.now()}`,
          name: 'Alpine_Valley_View.jpg',
          mimeType: 'image/jpeg',
          size: '4928100',
          createdTime: new Date(Date.now() - 3600000).toISOString(),
          thumbnailLink: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
          webContentLink: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=90',
          imageMediaMetadata: {
            width: 4000,
            height: 3000,
            cameraMake: 'Sony',
            cameraModel: 'A7 IV',
            focalLength: 35,
            exposureTime: 0.002,
            isoSpeed: 100,
            time: new Date(Date.now() - 3600000).toISOString(),
          },
        },
        {
          id: `drive-mock-file-2-${Date.now()}`,
          name: 'City_Sunset_Piers.jpg',
          mimeType: 'image/jpeg',
          size: '3491200',
          createdTime: new Date(Date.now() - 7200000).toISOString(),
          thumbnailLink: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
          webContentLink: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=90',
          imageMediaMetadata: {
            width: 3840,
            height: 2160,
            cameraMake: 'Fujifilm',
            cameraModel: 'X-T5',
            focalLength: 23,
            exposureTime: 0.004,
            isoSpeed: 200,
            time: new Date(Date.now() - 7200000).toISOString(),
          },
        },
      ];

      return {
        items: mockFiles.map((file) => this.normalizeDriveFile(file)),
        nextPageToken: undefined,
      };
    }
  }

  /**
   * Normalizes raw Drive file metadata into uniform CloudVault entity
   */
  public normalizeDriveFile(file: GoogleDriveFileRaw): NormalizedMediaItem {
    const isVideo = file.mimeType.startsWith('video/');
    const mediaType: MediaType = isVideo ? MediaType.VIDEO : MediaType.IMAGE;

    let capturedAt = new Date();
    if (file.imageMediaMetadata?.time) {
      capturedAt = new Date(file.imageMediaMetadata.time);
    } else if (file.createdTime) {
      capturedAt = new Date(file.createdTime);
    }

    const durationSeconds = file.videoMediaMetadata?.durationMillis
      ? Math.round(parseInt(file.videoMediaMetadata.durationMillis, 10) / 1000)
      : undefined;

    const width = file.imageMediaMetadata?.width || file.videoMediaMetadata?.width;
    const height = file.imageMediaMetadata?.height || file.videoMediaMetadata?.height;
    const aspectRatio = width && height ? parseFloat((width / height).toFixed(2)) : undefined;

    const exposureTimeFormatted = file.imageMediaMetadata?.exposureTime
      ? `1/${Math.round(1 / file.imageMediaMetadata.exposureTime)}s`
      : undefined;

    return {
      providerMediaId: file.id,
      filename: file.name,
      mimeType: file.mimeType,
      mediaType,
      sizeBytes: BigInt(file.size || '0'),
      capturedAt,
      thumbnailUrl: file.thumbnailLink || '',
      previewUrl: file.webContentLink || file.thumbnailLink || '',
      metadata: {
        width,
        height,
        aspectRatio,
        cameraModel: file.imageMediaMetadata?.cameraModel,
        focalLength: file.imageMediaMetadata?.focalLength,
        exposureTime: exposureTimeFormatted,
        iso: file.imageMediaMetadata?.isoSpeed,
        latitude: file.imageMediaMetadata?.location?.latitude,
        longitude: file.imageMediaMetadata?.location?.longitude,
        durationSeconds,
      },
    };
  }

  /**
   * Get authorized media access headers
   */
  public async getAuthorizedMediaAccess(providerMediaId: string): Promise<AuthorizedMediaAccess> {
    const accessToken = await this.refreshAccessToken();

    return {
      url: `https://www.googleapis.com/drive/v3/files/${providerMediaId}?alt=media`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }
}
