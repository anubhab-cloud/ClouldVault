import crypto from 'node:crypto';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { encryptToken, decryptToken } from '../../utils/crypto.js';
import { logger } from '../../utils/logger.js';
import { ProviderType, AccountStatus } from '@prisma/client';

export interface StatePayload {
  userId: string;
  provider: ProviderType;
  timestamp: number;
}

export class AccountsService {
  /**
   * Scopes according to provider
   */
  private static getScopesForProvider(provider: ProviderType): string[] {
    const baseScopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    if (provider === ProviderType.GOOGLE_DRIVE) {
      return [...baseScopes, 'https://www.googleapis.com/auth/drive.readonly'];
    } else {
      return [...baseScopes, 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'];
    }
  }

  /**
   * Create an HMAC-signed state parameter to prevent CSRF in OAuth flows
   */
  public static generateSignedState(userId: string, provider: ProviderType): string {
    const payload: StatePayload = {
      userId,
      provider,
      timestamp: Date.now(),
    };
    const payloadStr = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(payloadStr).digest('hex');
    const combined = JSON.stringify({ p: payloadStr, s: hmac });
    return Buffer.from(combined).toString('base64url');
  }

  /**
   * Verify an HMAC-signed state parameter
   */
  public static verifySignedState(stateBase64Url: string): StatePayload {
    try {
      const decoded = Buffer.from(stateBase64Url, 'base64url').toString('utf8');
      const { p, s } = JSON.parse(decoded);

      const expectedHmac = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET).update(p).digest('hex');
      if (s !== expectedHmac) {
        throw new Error('HMAC state verification failed');
      }

      const payload: StatePayload = JSON.parse(p);
      // Ensure state is not older than 15 minutes
      const maxAgeMs = 15 * 60 * 1000;
      if (Date.now() - payload.timestamp > maxAgeMs) {
        throw new Error('State parameter has expired');
      }

      return payload;
    } catch {
      const error = new Error('Invalid or expired OAuth state parameter');
      (error as unknown as { code: string; status: number }).code = 'INVALID_OAUTH_STATE';
      (error as unknown as { code: string; status: number }).status = 400;
      throw error;
    }
  }

  /**
   * Generate Google OAuth authorization URL
   */
  public static createAuthorizationUrl(userId: string, provider: ProviderType): { authUrl: string; state: string } {
    const state = this.generateSignedState(userId, provider);
    const scopes = this.getScopesForProvider(provider);

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      redirect_uri: env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/v1/accounts/google/callback',
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline', // Required to obtain a refresh token
      prompt: 'consent',     // Force prompt to ensure refresh token is returned
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return { authUrl, state };
  }

  /**
   * Handle OAuth callback from Google
   */
  public static async handleCallback(code: string, state: string): Promise<{ accountId: string; redirectUrl: string }> {
    const statePayload = this.verifySignedState(state);
    const { userId, provider } = statePayload;

    let tokenData: {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };

    let userInfo: {
      sub: string;
      email: string;
      name?: string;
    };

    // If client credentials are real, perform live exchange; otherwise handle dev test exchange
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CLIENT_SECRET !== 'dummy-dev-client-secret') {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_REDIRECT_URI || '',
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        logger.error('Failed to exchange Google OAuth code:', errorText);
        throw new Error('Google OAuth token exchange failed');
      }

      tokenData = (await tokenResponse.json()) as typeof tokenData;

      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to retrieve Google user profile');
      }

      userInfo = (await userResponse.json()) as typeof userInfo;
    } else {
      // Mock exchange for development / local testing fixtures
      logger.info('Simulating Google OAuth token exchange in dev mode');
      tokenData = {
        access_token: `mock-google-access-${Date.now()}`,
        refresh_token: `1//mock-google-refresh-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
        expires_in: 3600,
        scope: this.getScopesForProvider(provider).join(' '),
      };
      userInfo = {
        sub: `google-user-${Date.now()}`,
        email: `google.user.${Date.now()}@gmail.com`,
      };
    }

    if (!tokenData.refresh_token) {
      logger.warn('Google did not return a refresh token (user already consented previously)');
    }

    const encryptedToken = encryptToken(
      tokenData.refresh_token || 'existing-session-token',
      env.CURRENT_KEY_VERSION
    );

    const grantedScopes = tokenData.scope.split(' ');

    const account = await prisma.connectedAccount.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId,
          provider,
          providerAccountId: userInfo.sub,
        },
      },
      update: {
        email: userInfo.email,
        status: AccountStatus.ACTIVE,
        credential: {
          upsert: {
            create: {
              encryptedRefreshToken: encryptedToken.encryptedData,
              encryptionKeyVersion: encryptedToken.keyVersion,
              grantedScopes,
              expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            },
            update: {
              encryptedRefreshToken: encryptedToken.encryptedData,
              encryptionKeyVersion: encryptedToken.keyVersion,
              grantedScopes,
              expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            },
          },
        },
      },
      create: {
        userId,
        provider,
        providerAccountId: userInfo.sub,
        email: userInfo.email,
        status: AccountStatus.ACTIVE,
        credential: {
          create: {
            encryptedRefreshToken: encryptedToken.encryptedData,
            encryptionKeyVersion: encryptedToken.keyVersion,
            grantedScopes,
            expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          },
        },
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId,
        eventType: 'ACCOUNT_CONNECTED',
        metadata: {
          accountId: account.id,
          provider,
          email: account.email,
        },
      },
    });

    logger.info(`Google account connected successfully: ${account.id} (${account.email})`);

    // Redirect to mobile app scheme
    const redirectUrl = `cloudvault://auth/google/success?accountId=${account.id}&email=${encodeURIComponent(account.email)}`;
    return { accountId: account.id, redirectUrl };
  }

  /**
   * List connected accounts for authenticated user
   */
  public static async listAccounts(userId: string) {
    return prisma.connectedAccount.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        provider: true,
        providerAccountId: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Disconnect Google account and revoke token
   */
  public static async disconnectAccount(userId: string, accountId: string): Promise<void> {
    const account = await prisma.connectedAccount.findFirst({
      where: { id: accountId, userId },
      include: { credential: true },
    });

    if (!account) {
      const error = new Error('Account not found or access denied');
      (error as unknown as { code: string; status: number }).code = 'ACCOUNT_NOT_FOUND';
      (error as unknown as { code: string; status: number }).status = 404;
      throw error;
    }

    // Attempt token revocation with Google
    if (account.credential?.encryptedRefreshToken) {
      try {
        const rawRefreshToken = decryptToken(
          account.credential.encryptedRefreshToken,
          account.credential.encryptionKeyVersion
        );

        if (!rawRefreshToken.startsWith('existing-session')) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(rawRefreshToken)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }).catch((err) => {
            logger.warn('Token revocation with Google failed:', err.message);
          });
        }
      } catch (err) {
        logger.warn('Failed to decrypt token for revocation:', err);
      }
    }

    // Delete account and cascade
    await prisma.connectedAccount.delete({
      where: { id: accountId },
    });

    await prisma.auditEvent.create({
      data: {
        userId,
        eventType: 'ACCOUNT_DISCONNECTED',
        metadata: {
          accountId,
          email: account.email,
          provider: account.provider,
        },
      },
    });

    logger.info(`Google account disconnected and credentials purged: ${accountId}`);
  }
}
