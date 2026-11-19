import { Router, Request, Response } from 'express';
import { sendSuccess } from '../../common/response.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    version: '1.0.0',
  });
});
