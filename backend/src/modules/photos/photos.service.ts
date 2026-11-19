import { prisma } from '../../config/db.js';
import { MediaType, ProviderType, Prisma } from '@prisma/client';

export interface PhotoQueryParams {
  limit?: number;
  cursor?: string;
  page?: number;
  accountId?: string;
  provider?: string;
  mediaType?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CursorPayload {
  capturedAt: string;
  id: string;
}

export class PhotosService {
  /**
   * Encode cursor for keyset pagination
   */
  public static encodeCursor(capturedAt: Date, id: string): string {
    const payload: CursorPayload = {
      capturedAt: capturedAt.toISOString(),
      id,
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  /**
   * Decode keyset pagination cursor
   */
  public static decodeCursor(cursorString: string): CursorPayload | null {
    try {
      const decoded = Buffer.from(cursorString, 'base64url').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Retrieve unified photos for the authenticated user
   */
  public static async getUnifiedPhotos(userId: string, params: PhotoQueryParams) {
    const limit = Math.min(Math.max(params.limit || 30, 1), 100);

    // Base filter: user ownership is strictly enforced
    const where: Prisma.PhotoWhereInput = {
      account: {
        userId,
        ...(params.accountId ? { id: params.accountId } : {}),
        ...(params.provider
          ? {
              provider:
                params.provider.toUpperCase() === 'GOOGLE_PHOTOS'
                  ? ProviderType.GOOGLE_PHOTOS
                  : ProviderType.GOOGLE_DRIVE,
            }
          : {}),
      },
    };

    // Filter: mediaType ('IMAGE' | 'VIDEO')
    if (params.mediaType) {
      where.mediaType =
        params.mediaType.toUpperCase() === 'VIDEO' ? MediaType.VIDEO : MediaType.IMAGE;
    }

    // Filter: search by filename
    if (params.search && params.search.trim().length > 0) {
      where.filename = {
        contains: params.search.trim(),
        mode: 'insensitive',
      };
    }

    // Filter: date range
    if (params.fromDate || params.toDate) {
      where.capturedAt = {
        ...(params.fromDate ? { gte: new Date(params.fromDate) } : {}),
        ...(params.toDate ? { lte: new Date(params.toDate) } : {}),
      };
    }

    // Keyset pagination using cursor: WHERE (capturedAt < cursorDate) OR (capturedAt = cursorDate AND id < cursorId)
    if (params.cursor) {
      const cursorData = this.decodeCursor(params.cursor);
      if (cursorData) {
        const cursorDate = new Date(cursorData.capturedAt);
        where.OR = [
          { capturedAt: { lt: cursorDate } },
          {
            capturedAt: cursorDate,
            id: { lt: cursorData.id },
          },
        ];
      }
    }

    // Fetch limit + 1 to check if there is a next page
    const take = limit + 1;
    const skip = !params.cursor && params.page && params.page > 1 ? (params.page - 1) * limit : 0;

    const photos = await prisma.photo.findMany({
      where,
      take,
      skip,
      orderBy: [{ capturedAt: 'desc' }, { id: 'desc' }],
      include: {
        account: {
          select: {
            id: true,
            email: true,
            provider: true,
          },
        },
      },
    });

    const hasMore = photos.length > limit;
    const items = hasMore ? photos.slice(0, limit) : photos;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = this.encodeCursor(lastItem.capturedAt, lastItem.id);
    }

    return {
      photos: items.map((p) => {
        const isPhotos = p.account.provider === ProviderType.GOOGLE_PHOTOS;
        const accessEndpoint = isPhotos
          ? `/api/v1/google-photos/media/${p.id}/access`
          : `/api/v1/drive/files/${p.id}/access`;

        return {
          id: p.id,
          connectedAccountId: p.connectedAccountId,
          providerMediaId: p.providerMediaId,
          filename: p.filename,
          mimeType: p.mimeType,
          mediaType: p.mediaType.toLowerCase(),
          sizeBytes: p.sizeBytes.toString(),
          capturedAt: p.capturedAt.toISOString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          thumbnailUrl: accessEndpoint,
          previewUrl: accessEndpoint,
          accountEmail: p.account.email,
          provider: p.account.provider.toLowerCase().replace('_', '-'),
          metadata: p.metadataJson,
        };
      }),
      nextCursor,
      hasMore,
      count: items.length,
    };
  }

  /**
   * Retrieve single photo by ID
   */
  public static async getPhotoById(userId: string, photoId: string) {
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        account: { userId },
      },
      include: {
        account: {
          select: {
            email: true,
            provider: true,
          },
        },
      },
    });

    if (!photo) {
      const error = new Error('Photo not found');
      (error as unknown as { code: string; status: number }).code = 'PHOTO_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    const isPhotos = photo.account.provider === ProviderType.GOOGLE_PHOTOS;
    const accessEndpoint = isPhotos
      ? `/api/v1/google-photos/media/${photo.id}/access`
      : `/api/v1/drive/files/${photo.id}/access`;

    return {
      id: photo.id,
      connectedAccountId: photo.connectedAccountId,
      providerMediaId: photo.providerMediaId,
      filename: photo.filename,
      mimeType: photo.mimeType,
      mediaType: photo.mediaType.toLowerCase(),
      sizeBytes: photo.sizeBytes.toString(),
      capturedAt: photo.capturedAt.toISOString(),
      thumbnailUrl: accessEndpoint,
      previewUrl: accessEndpoint,
      accountEmail: photo.account.email,
      provider: photo.account.provider.toLowerCase().replace('_', '-'),
      metadata: photo.metadataJson,
    };
  }

  /**
   * Delete photo metadata from CloudVault
   */
  public static async deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        account: { userId },
      },
    });

    if (!photo) {
      const error = new Error('Photo not found');
      (error as unknown as { code: string; status: number }).code = 'PHOTO_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });
  }
}
