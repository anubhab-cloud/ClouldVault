import { Request, Response, NextFunction } from 'express';
import { AccountsService } from './accounts.service.js';
import { sendSuccess, sendError } from '../../common/response.js';
import { ProviderType } from '@prisma/client';

export class AccountsController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }
      const accounts = await AccountsService.listAccounts(req.user.id);
      sendSuccess(res, { accounts }, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async authorizeGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }

      const providerParam = (req.body?.provider as string) || 'GOOGLE_DRIVE';
      const provider =
        providerParam.toUpperCase() === 'GOOGLE_PHOTOS'
          ? ProviderType.GOOGLE_PHOTOS
          : ProviderType.GOOGLE_DRIVE;

      const { authUrl, state } = AccountsService.createAuthorizationUrl(req.user.id, provider);
      sendSuccess(res, { authUrl, state }, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;

      if (!code || !state) {
        sendError(res, 'MISSING_CALLBACK_PARAMS', 'Authorization code and state are required', 400);
        return;
      }

      const { redirectUrl } = await AccountsService.handleCallback(code, state);

      // In browser, redirect to app scheme (or render friendly HTML success redirect)
      res.redirect(redirectUrl);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'OAuth callback failed', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async disconnect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }

      const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
      await AccountsService.disconnectAccount(req.user.id, accountId);
      sendSuccess(res, { message: 'Account disconnected successfully' }, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Failed to disconnect account', customError.status);
        return;
      }
      next(error);
    }
  }
}
