import { prisma } from '../../config/db.js';
import { decryptToken } from '../../utils/crypto.js';
import { GoogleDriveClient } from '../../integrations/google-drive/drive.client.js';
import { logger } from '../../utils/logger.js';
import { SyncJobStatus, ProviderType, Prisma } from '@prisma/client';

export interface SyncResult {
  jobId: string;
  accountId: string;
  photosAdded: number;
  status: SyncJobStatus;
}

export class DriveSyncService {
  /**
   * Run synchronization for a connected Google Drive account
   */
  public static async syncAccount(userId: string, accountId: string): Promise<SyncResult> {
    const account = await prisma.connectedAccount.findFirst({
      where: { id: accountId, userId, provider: ProviderType.GOOGLE_DRIVE },
      include: { credential: true, syncState: true },
    });

    if (!account || !account.credential) {
      const error = new Error('Account or credentials not found');
      (error as unknown as { code: string; status: number }).code = 'ACCOUNT_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    // 1. Create SyncJob
    const job = await prisma.syncJob.create({
      data: {
        connectedAccountId: account.id,
        status: SyncJobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    logger.info(`Starting Drive synchronization for account ${account.email} (Job: ${job.id})`);

    try {
      // 2. Decrypt stored provider refresh token
      const rawRefreshToken = decryptToken(
        account.credential.encryptedRefreshToken,
        account.credential.encryptionKeyVersion
      );

      // 3. Initialize Drive driver
      const driveClient = new GoogleDriveClient(rawRefreshToken);

      // 4. List and page through Drive media
      const mediaListResult = await driveClient.listMedia({
        pageToken: account.syncState?.providerCursor || undefined,
        pageSize: 100,
      });

      let addedCount = 0;

      // 5. Upsert normalized photos in transaction or batch
      for (const item of mediaListResult.items) {
        await prisma.photo.upsert({
          where: {
            connectedAccountId_providerMediaId: {
              connectedAccountId: account.id,
              providerMediaId: item.providerMediaId,
            },
          },
          update: {
            filename: item.filename,
            mimeType: item.mimeType,
            mediaType: item.mediaType,
            sizeBytes: item.sizeBytes,
            capturedAt: item.capturedAt,
            metadataJson: item.metadata ? (item.metadata as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
            updatedAt: new Date(),
          },
          create: {
            connectedAccountId: account.id,
            providerMediaId: item.providerMediaId,
            filename: item.filename,
            mimeType: item.mimeType,
            mediaType: item.mediaType,
            sizeBytes: item.sizeBytes,
            capturedAt: item.capturedAt,
            metadataJson: item.metadata ? (item.metadata as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          },
        });
        addedCount++;
      }

      // 6. Update Sync State cursor
      await prisma.providerSyncState.upsert({
        where: { connectedAccountId: account.id },
        update: {
          providerCursor: mediaListResult.nextPageToken || null,
          lastSyncedAt: new Date(),
        },
        create: {
          connectedAccountId: account.id,
          providerCursor: mediaListResult.nextPageToken || null,
          lastSyncedAt: new Date(),
        },
      });

      // 7. Mark Job as Completed
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: SyncJobStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      logger.info(`Sync job completed successfully. Synced ${addedCount} items.`);

      return {
        jobId: job.id,
        accountId: account.id,
        photosAdded: addedCount,
        status: SyncJobStatus.COMPLETED,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown sync failure';
      logger.error(`Sync job ${job.id} failed:`, errorMessage);

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: SyncJobStatus.FAILED,
          completedAt: new Date(),
          errorCode: 'SYNC_FAILED',
          errorMessage,
        },
      });

      throw err;
    }
  }

  /**
   * Get sync status and history for an account
   */
  public static async getSyncJobs(userId: string, accountId?: string) {
    return prisma.syncJob.findMany({
      where: {
        account: {
          userId,
          ...(accountId ? { id: accountId } : {}),
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }
}
