import { Request, Response, NextFunction } from 'express';
import { GooglePhotosService } from './photos-picker.service.js';
import { sendSuccess } from '../../common/response.js';

export class GooglePhotosController {
  public static async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.body;
      const session = await GooglePhotosService.createPickerSession(req.user!.id, accountId);
      sendSuccess(res, session, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getSessionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      const accountId = req.query.accountId as string;

      if (!accountId) {
        const error = new Error('Query parameter accountId is required');
        (error as unknown as { code: string; status: number }).code = 'MISSING_ACCOUNT_ID';
        (error as unknown as { code: string; status: number }).status = 400;
        throw error;
      }

      const status = await GooglePhotosService.getPickerSessionStatus(req.user!.id, accountId, sessionId);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }

  public static async importMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      const { accountId } = req.body;

      const result = await GooglePhotosService.importSelectedMedia(req.user!.id, accountId, sessionId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async getMediaAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const photoId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const access = await GooglePhotosService.getMediaAccess(req.user!.id, photoId);
      sendSuccess(res, access);
    } catch (error) {
      next(error);
    }
  }
}
