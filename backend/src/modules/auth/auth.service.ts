import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const SALT_ROUNDS = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  };
  tokens: TokenPair;
}

export class AuthService {
  /**
   * Hash a refresh token before storing in database
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate Access and Refresh JWT pair
   */
  private static generateTokens(userId: string, email: string): TokenPair {
    const accessToken = jwt.sign(
      { sub: userId, email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      { sub: userId, email, jti: crypto.randomUUID() },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Calculate session expiry date based on JWT_REFRESH_EXPIRES_IN (default: 7 days)
   */
  private static getSessionExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  /**
   * Register a new user
   */
  public static async register(email: string, password: string, name: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const error = new Error('Email is already registered');
      (error as unknown as { code: string; status: number }).code = 'EMAIL_ALREADY_EXISTS';
      (error as unknown as { code: string; status: number }).status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
      },
    });

    const tokens = this.generateTokens(user.id, user.email);
    const refreshTokenHash = this.hashToken(tokens.refreshToken);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: this.getSessionExpiry(),
      },
    });

    logger.info(`User registered successfully: ${user.id} (${user.email})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  /**
   * Authenticate an existing user
   */
  public static async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      const error = new Error('Invalid email or password');
      (error as unknown as { code: string; status: number }).code = 'INVALID_CREDENTIALS';
      (error as unknown as { code: string; status: number }).status = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      (error as unknown as { code: string; status: number }).code = 'INVALID_CREDENTIALS';
      (error as unknown as { code: string; status: number }).status = 401;
      throw error;
    }

    const tokens = this.generateTokens(user.id, user.email);
    const refreshTokenHash = this.hashToken(tokens.refreshToken);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: this.getSessionExpiry(),
      },
    });

    logger.info(`User logged in: ${user.id} (${user.email})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  /**
   * Rotate refresh token and issue new token pair
   */
  public static async refreshToken(token: string): Promise<TokenPair> {
    let payload: { sub: string; email: string };
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; email: string };
    } catch {
      const error = new Error('Invalid or expired refresh token');
      (error as unknown as { code: string; status: number }).code = 'INVALID_REFRESH_TOKEN';
      (error as unknown as { code: string; status: number }).status = 401;
      throw error;
    }

    const oldHash = this.hashToken(token);

    const session = await prisma.userSession.findUnique({
      where: { refreshTokenHash: oldHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      const error = new Error('Session is revoked or expired');
      (error as unknown as { code: string; status: number }).code = 'SESSION_REVOKED';
      (error as unknown as { code: string; status: number }).status = 401;
      throw error;
    }

    // Generate new token pair
    const tokens = this.generateTokens(session.userId, session.user.email);
    const newHash = this.hashToken(tokens.refreshToken);

    // Rotate: update existing session with new hash and refresh expiration
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newHash,
        expiresAt: this.getSessionExpiry(),
      },
    });

    return tokens;
  }

  /**
   * Revoke active session on logout
   */
  public static async logout(token: string): Promise<void> {
    const hash = this.hashToken(token);
    await prisma.userSession.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Get user profile by ID
   */
  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      const error = new Error('User not found');
      (error as unknown as { code: string; status: number }).code = 'USER_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    return user;
  }

  /**
   * Delete user account and cascade all data
   */
  public static async deleteAccount(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
    logger.info(`User account deleted: ${userId}`);
  }
}
