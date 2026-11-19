import { Request, Response, NextFunction } from 'express';
import { StorageService } from './storage.service.js';
import { sendSuccess, sendError } from '../../common/response.js';

export class StorageController {
  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }
      const summary = await StorageService.getStorageSummary(req.user.id);
      sendSuccess(res, summary, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async getAccountStorage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }
      const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
      const storage = await StorageService.getAccountStorage(req.user.id, accountId);
      sendSuccess(res, storage, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Storage fetch failed', customError.status);
        return;
      }
      next(error);
    }
  }
}
