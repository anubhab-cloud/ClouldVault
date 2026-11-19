import { prisma } from '../../config/db.js';

export interface CreateAlbumDTO {
  name: string;
  description?: string;
}

export interface UpdateAlbumDTO {
  name?: string;
  description?: string;
}

export class AlbumsService {
  /**
   * List all albums for an authenticated user with cover photo and photo count
   */
  public static async listAlbums(userId: string) {
    const albums = await prisma.album.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { photos: true },
        },
        photos: {
          take: 1,
          orderBy: { addedAt: 'desc' },
          include: {
            photo: {
              select: {
                id: true,
                filename: true,
                account: {
                  select: { provider: true },
                },
              },
            },
          },
        },
      },
    });

    return albums.map((album) => {
      const coverPhoto = album.photos[0]?.photo;
      const isPhotos = coverPhoto?.account?.provider === 'GOOGLE_PHOTOS';
      const coverPhotoUrl = coverPhoto
        ? (isPhotos ? `/api/v1/google-photos/media/${coverPhoto.id}/access` : `/api/v1/drive/files/${coverPhoto.id}/access`)
        : undefined;

      return {
        id: album.id,
        userId: album.userId,
        name: album.name,
        description: album.description,
        photoCount: album._count.photos,
        coverPhotoUrl,
        createdAt: album.createdAt.toISOString(),
        updatedAt: album.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Create a new virtual album
   */
  public static async createAlbum(userId: string, data: CreateAlbumDTO) {
    const album = await prisma.album.create({
      data: {
        userId,
        name: data.name.trim(),
        description: data.description?.trim(),
      },
    });

    return {
      id: album.id,
      userId: album.userId,
      name: album.name,
      description: album.description,
      photoCount: 0,
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
    };
  }

  /**
   * Get album details and member photos
   */
  public static async getAlbumById(userId: string, albumId: string) {
    const album = await prisma.album.findFirst({
      where: { id: albumId, userId },
      include: {
        photos: {
          orderBy: { addedAt: 'desc' },
          include: {
            photo: {
              include: {
                account: {
                  select: { email: true, provider: true },
                },
              },
            },
          },
        },
      },
    });

    if (!album) {
      const error = new Error('Album not found');
      (error as unknown as { code: string; status: number }).code = 'ALBUM_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    return {
      id: album.id,
      name: album.name,
      description: album.description,
      photoCount: album.photos.length,
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
      photos: album.photos.map(({ photo, addedAt }) => {
        const isPhotos = photo.account.provider === 'GOOGLE_PHOTOS';
        const accessEndpoint = isPhotos
          ? `/api/v1/google-photos/media/${photo.id}/access`
          : `/api/v1/drive/files/${photo.id}/access`;

        return {
          id: photo.id,
          filename: photo.filename,
          mimeType: photo.mimeType,
          mediaType: photo.mediaType.toLowerCase(),
          sizeBytes: photo.sizeBytes.toString(),
          capturedAt: photo.capturedAt.toISOString(),
          thumbnailUrl: accessEndpoint,
          previewUrl: accessEndpoint,
          accountEmail: photo.account.email,
          provider: photo.account.provider.toLowerCase().replace('_', '-'),
          addedAt: addedAt.toISOString(),
        };
      }),
    };
  }

  /**
   * Rename or update album description
   */
  public static async updateAlbum(userId: string, albumId: string, data: UpdateAlbumDTO) {
    const existing = await prisma.album.findFirst({
      where: { id: albumId, userId },
    });

    if (!existing) {
      const error = new Error('Album not found');
      (error as unknown as { code: string; status: number }).code = 'ALBUM_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    const updated = await prisma.album.update({
      where: { id: albumId },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Delete album collection
   */
  public static async deleteAlbum(userId: string, albumId: string): Promise<void> {
    const existing = await prisma.album.findFirst({
      where: { id: albumId, userId },
    });

    if (!existing) {
      const error = new Error('Album not found');
      (error as unknown as { code: string; status: number }).code = 'ALBUM_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    await prisma.album.delete({
      where: { id: albumId },
    });
  }

  /**
   * Add a photo to an album with cross-user IDOR protection
   */
  public static async addPhotoToAlbum(userId: string, albumId: string, photoId: string) {
    // 1. Verify album belongs to authenticated user
    const album = await prisma.album.findFirst({
      where: { id: albumId, userId },
    });

    if (!album) {
      const error = new Error('Album not found');
      (error as unknown as { code: string; status: number }).code = 'ALBUM_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    // 2. CRITICAL SECURITY: Verify photo belongs to authenticated user
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        account: { userId },
      },
    });

    if (!photo) {
      const error = new Error('Photo not found or access denied');
      (error as unknown as { code: string; status: number }).code = 'PHOTO_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    // 3. Upsert association
    await prisma.albumPhoto.upsert({
      where: {
        albumId_photoId: {
          albumId,
          photoId,
        },
      },
      update: {},
      create: {
        albumId,
        photoId,
      },
    });

    // Touch album updatedAt
    await prisma.album.update({
      where: { id: albumId },
      data: { updatedAt: new Date() },
    });

    return { success: true, albumId, photoId };
  }

  /**
   * Remove a photo from an album
   */
  public static async removePhotoFromAlbum(userId: string, albumId: string, photoId: string) {
    const album = await prisma.album.findFirst({
      where: { id: albumId, userId },
    });

    if (!album) {
      const error = new Error('Album not found');
      (error as unknown as { code: string; status: number }).code = 'ALBUM_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    await prisma.albumPhoto.deleteMany({
      where: {
        albumId,
        photoId,
      },
    });

    return { success: true, albumId, photoId };
  }
}
