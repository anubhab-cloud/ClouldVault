import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authGuard } from '../../middleware/authGuard.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { AuthController } from './auth.controller.js';

export const authRouter = Router();

// Strict limiter for authentication endpoints (20 attempts per minute per IP)
const authLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Too many authentication attempts. Please try again after 1 minute.',
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

authRouter.post('/auth/register', authLimiter, validate(registerSchema), AuthController.register);
authRouter.post('/auth/login', authLimiter, validate(loginSchema), AuthController.login);
authRouter.post('/auth/refresh', authLimiter, validate(refreshSchema), AuthController.refresh);
authRouter.post('/auth/logout', AuthController.logout);

authRouter.get('/auth/me', authGuard, AuthController.me);
authRouter.delete('/auth/account', authGuard, AuthController.deleteAccount);
