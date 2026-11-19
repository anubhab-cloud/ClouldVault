import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../common/response.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const result = await AuthService.register(email, password, name);
      sendSuccess(res, result, 201);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Registration failed', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      sendSuccess(res, result, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Authentication failed', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        sendError(res, 'MISSING_REFRESH_TOKEN', 'Refresh token is required', 400);
        return;
      }
      const tokens = await AuthService.refreshToken(refreshToken);
      sendSuccess(res, tokens, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Token refresh failed', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      sendSuccess(res, { message: 'Logged out successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'User session not found', 401);
        return;
      }
      const user = await AuthService.getProfile(req.user.id);
      sendSuccess(res, { user }, 200);
    } catch (error: unknown) {
      const customError = error as { code?: string; status?: number; message?: string };
      if (customError.code && customError.status) {
        sendError(res, customError.code, customError.message || 'Profile fetch failed', customError.status);
        return;
      }
      next(error);
    }
  }

  public static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'User session not found', 401);
        return;
      }
      await AuthService.deleteAccount(req.user.id);
      sendSuccess(res, { message: 'Account and associated data deleted permanently' }, 200);
    } catch (error) {
      next(error);
    }
  }
}
