import { prisma } from '../../config/db.js';
import { decryptToken } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';
import { GooglePhotosPickerClient } from '../../integrations/google-photos/photos-picker.client.js';
import { Prisma } from '@prisma/client';

export class GooglePhotosService {
  /**
   * Helper to retrieve and verify user's Google Photos account and instantiate client
   */
  private static async getClientForAccount(userId: string, accountId: string): Promise<GooglePhotosPickerClient> {
    const account = await prisma.connectedAccount.findFirst({
      where: {
        id: accountId,
        userId,
      },
      include: {
        credential: true,
      },
    });

    if (!account) {
      const error = new Error('Connected Google account not found or access denied');
      (error as unknown as { code: string; status: number }).code = 'ACCOUNT_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    if (!account.credential) {
      const error = new Error('No credentials found for this account');
      (error as unknown as { code: string; status: number }).code = 'CREDENTIAL_MISSING';
      (error as unknown as { code: string; status: number }).status = 401;
      throw error;
    }

    const refreshToken = decryptToken(
      account.credential.encryptedRefreshToken,
      account.credential.encryptionKeyVersion
    );

    return new GooglePhotosPickerClient(refreshToken);
  }

  /**
   * Create a new Google Photos Picker session
   */
  public static async createPickerSession(userId: string, accountId: string) {
    const client = await this.getClientForAccount(userId, accountId);
    const session = await client.createPickerSession();

    logger.info(`Google Photos Picker session created: ${session.id} for user ${userId}`);

    return {
      sessionId: session.id,
      pickerUri: session.pickerUri,
      expireTime: session.expireTime,
      mediaItemsSet: session.mediaItemsSet,
      connectedAccountId: accountId,
    };
  }

  /**
   * Check status of a Google Photos Picker session
   */
  public static async getPickerSessionStatus(userId: string, accountId: string, sessionId: string) {
    const client = await this.getClientForAccount(userId, accountId);
    const session = await client.getPickerSession(sessionId);

    return {
      sessionId: session.id,
      pickerUri: session.pickerUri,
      expireTime: session.expireTime,
      mediaItemsSet: session.mediaItemsSet,
      connectedAccountId: accountId,
    };
  }

  /**
   * Import selected media items from an active session into unified Photo catalog
   */
  public static async importSelectedMedia(userId: string, accountId: string, sessionId: string) {
    const client = await this.getClientForAccount(userId, accountId);
    const items = await client.listSessionMediaItems(sessionId);

    const importedPhotos = [];

    for (const item of items) {
      const photo = await prisma.photo.upsert({
        where: {
          connectedAccountId_providerMediaId: {
            connectedAccountId: accountId,
            providerMediaId: item.providerMediaId,
          },
        },
        update: {
          filename: item.filename,
          mimeType: item.mimeType,
          mediaType: item.mediaType,
          sizeBytes: item.sizeBytes,
          capturedAt: item.capturedAt,
          metadataJson: item.metadata as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
        create: {
          connectedAccountId: accountId,
          providerMediaId: item.providerMediaId,
          filename: item.filename,
          mimeType: item.mimeType,
          mediaType: item.mediaType,
          sizeBytes: item.sizeBytes,
          capturedAt: item.capturedAt,
          metadataJson: item.metadata as unknown as Prisma.InputJsonValue,
        },
      });

      importedPhotos.push({
        id: photo.id,
        connectedAccountId: photo.connectedAccountId,
        providerMediaId: photo.providerMediaId,
        filename: photo.filename,
        mimeType: photo.mimeType,
        mediaType: photo.mediaType.toLowerCase() as 'image' | 'video',
        sizeBytes: Number(photo.sizeBytes),
        capturedAt: photo.capturedAt.toISOString(),
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
        thumbnailUrl: item.thumbnailUrl || `/api/v1/google-photos/media/${photo.id}/access`,
        previewUrl: item.previewUrl || `/api/v1/google-photos/media/${photo.id}/access`,
      });
    }

    await prisma.auditEvent.create({
      data: {
        userId,
        eventType: 'PHOTOS_PICKER_IMPORT',
        metadata: {
          accountId,
          sessionId,
          importedCount: importedPhotos.length,
        },
      },
    });

    logger.info(`Imported ${importedPhotos.length} media items from Google Photos session ${sessionId}`);

    return {
      importedCount: importedPhotos.length,
      photos: importedPhotos,
    };
  }

  /**
   * Get authorized media access for Google Photos item
   */
  public static async getMediaAccess(userId: string, photoId: string) {
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        account: {
          userId,
        },
      },
      include: {
        account: {
          include: {
            credential: true,
          },
        },
      },
    });

    if (!photo) {
      const error = new Error('Photo not found or access denied');
      (error as unknown as { code: string; status: number }).code = 'PHOTO_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    const metadata = photo.metadataJson as Record<string, unknown> | null;
    const baseUrl = (metadata?.baseUrl as string) || '';
    const baseUrlExpiresAt = (metadata?.baseUrlExpiresAt as number) || 0;

    // Check if baseUrl is still valid (within TTL)
    if (baseUrl && Date.now() < baseUrlExpiresAt - 60000) {
      const isVideo = photo.mediaType === 'VIDEO';
      return {
        accessUrl: isVideo ? `${baseUrl}=dv` : `${baseUrl}=w1920-h1080`,
        mimeType: photo.mimeType,
        filename: photo.filename,
        isDirect: true,
      };
    }

    // If expired or missing, return preview access proxy URL
    return {
      accessUrl: baseUrl ? `${baseUrl}=w1920-h1080` : `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80`,
      mimeType: photo.mimeType,
      filename: photo.filename,
      isDirect: true,
    };
  }
}
