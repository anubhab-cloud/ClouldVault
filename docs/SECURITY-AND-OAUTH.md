
# CloudVault - Security and OAuth Policy

## 1. Security Philosophy

CloudVault handles sensitive personal media.

Security, privacy and transparency are mandatory.

## 2. Authentication Architecture

Separate:
1. CloudVault user authentication.
2. External Google account authorization.

A user may sign into CloudVault using one identity
and connect multiple independent Google accounts.

## 3. OAuth Architecture

Use Google OAuth 2.0.

For server-side authorization:
- Authorization Code flow.
- PKCE where supported.
- Random state validation.
- Exact redirect URI validation.
- Secure token exchange on backend.
- Least-privilege scopes.

Never place Google client secrets in mobile code.

## 4. Multiple Account Authorization

Each connected account requires:
- Independent provider account ID.
- Independent authorization.
- Independent scopes.
- Independent credentials.
- Independent connection status.

Never reuse one account's credentials for another.

## 5. Token Security

Refresh tokens:
- Encrypted before database storage.
- Decrypted only by authorized backend services.
- Never returned to the mobile application.
- Never written to application logs.

Use a managed KMS or secrets-management system
for encryption key management.

Use key versioning and a rotation strategy.

Access tokens should be short-lived.

## 6. Google Drive Permissions

Start with minimum necessary scopes.

drive.file:
Provides access to files individually created by,
opened with, or explicitly shared with the application
according to Google's authorization model.

It does not provide unrestricted access to all
existing Drive files.

drive.readonly:
Allows broader read-only Drive access but is a
restricted scope requiring additional verification
and potentially a security assessment.

Never request broader scopes without a validated
product requirement.

## 7. Google Photos Permissions

Use Google Photos Picker API for user-selected media.

Important:
- Users select the media.
- Do not implement unrestricted library scanning.
- Handle picker session lifecycle.
- Handle temporary media access expiry.
- Do not assume URLs are permanent.
- Follow Google's permitted use and retention policies.

## 8. API Security

Implement:
- HTTPS.
- Request validation.
- Rate limiting.
- Authentication middleware.
- Authorization middleware.
- Secure CORS configuration.
- Safe error handling.
- Audit logging.

Every resource lookup must verify user ownership.

Prevent IDOR vulnerabilities.

## 9. Mobile Security

- Use Expo SecureStore for application secrets
  and app session credentials where appropriate.
- Never store provider refresh tokens on-device.
- Do not hardcode secrets.
- Avoid sensitive information in logs.
- Use secure deep links and OAuth callbacks.
- Protect against accidental credential exposure.

## 10. Account Disconnection

When an account is disconnected:
1. Stop associated sync jobs.
2. Revoke provider authorization where possible.
3. Delete stored provider credentials.
4. Remove or invalidate associated media access.
5. Apply the documented metadata-retention policy.

## 11. User Privacy

Provide:
- Privacy policy.
- Terms of service.
- Consent information.
- Data export process.
- Account deletion process.
- Permission management.
- Clear explanation of provider data access.

## 12. Google Compliance

Follow:
- Google API Services User Data Policy.
- OAuth verification requirements.
- Restricted-scope requirements.
- Applicable Google Photos API policies.
- Applicable data retention and deletion policies.

Do not use Google user data for advertising
or unrelated purposes.

## 13. Security Testing

Test:
- Unauthorized access.
- Cross-user data leakage.
- Token leakage.
- Expired token handling.
- Revoked permissions.
- OAuth state validation.
- Refresh token rotation.
- Account disconnection.
- API rate limiting.

## 14. Production Release

Do not release publicly until:
- OAuth verification requirements are satisfied.
- Privacy policy is published.
- Data deletion workflow works.
- Security testing is completed.
- API permissions are reviewed.
