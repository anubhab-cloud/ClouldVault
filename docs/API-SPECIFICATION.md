
# CloudVault - API Specification

## 1. API Standards

Base URL:
 /api/v1

Protocol:
 HTTPS

Format:
 JSON

Authentication:
 Bearer access token.

All protected endpoints must validate user ownership.

## 2. Authentication

POST /auth/register
Create CloudVault account.

POST /auth/login
Authenticate user.

POST /auth/refresh
Rotate application refresh session.

POST /auth/logout
Revoke current session.

GET /auth/me
Retrieve authenticated user.

DELETE /auth/account
Request account deletion.

## 3. Google Account Management

GET /accounts
List connected accounts.

POST /accounts/google/authorize
Create a secure Google authorization transaction.

GET /accounts/google/callback
Handle backend OAuth callback.

GET /accounts/:accountId
Retrieve account details.

DELETE /accounts/:accountId
Disconnect Google account.

POST /accounts/:accountId/reauthorize
Reauthorize expired access.

All account operations must verify ownership.

## 4. Google Drive Integration

POST /drive/picker/sessions
Create a file-selection session where supported.

GET /drive/files
List files accessible under granted permissions.

GET /drive/files/:fileId
Retrieve file metadata.

GET /drive/files/:fileId/access
Obtain authorized access for media preview.

POST /drive/sync
Start permitted metadata synchronization.

Drive queries must respect actual granted scopes.

## 5. Google Photos Integration

POST /google-photos/picker-sessions
Create a Photos Picker session.

GET /google-photos/picker-sessions/:sessionId
Check selection session status.

POST /google-photos/picker-sessions/:sessionId/import
Import selected media metadata.

GET /google-photos/media/:id/access
Retrieve permitted media access when valid.

Handle session and media access expiry.

Do not implement unrestricted Photos library scanning.

## 6. Unified Gallery

GET /photos

Supported query parameters:
- page (offset-based fallback)
- cursor (keyset pagination cursor based on capturedAt + id)
- limit
- accountId
- provider
- mediaType
- search
- fromDate
- toDate
- sort

GET /photos/:photoId

DELETE /photos/:photoId
Remove CloudVault metadata only unless an explicit,
separate provider deletion feature is implemented.

## 7. Albums

GET /albums
POST /albums
GET /albums/:albumId
PATCH /albums/:albumId
DELETE /albums/:albumId

POST /albums/:albumId/photos
DELETE /albums/:albumId/photos/:photoId

Validate that photos belong to the authenticated user.

## 8. Storage

GET /storage/summary

GET /storage/accounts/:accountId

Return:
- Used bytes when available.
- Quota bytes when available.
- Available bytes when available.
- Measurement source.
- Last updated time.

Never fabricate missing usage information.

## 9. Synchronization

POST /sync
GET /sync/jobs
GET /sync/jobs/:jobId

Return job status and safe error information.

## 10. Standard Response

Success:

{
  "success": true,
  "data": {},
  "meta": {}
}

Error:

{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Requested resource was not found"
  }
}

## 11. Error Handling

Use appropriate HTTP status codes:

200 - Successful request
201 - Resource created
204 - Successful deletion
400 - Invalid request
401 - Unauthenticated
403 - Unauthorized
404 - Not found
409 - Conflict
422 - Validation failure
429 - Rate limit exceeded
500 - Internal server error

Never expose internal stack traces or provider secrets.

## 12. API Documentation

Use OpenAPI 3.x.

Keep endpoint contracts synchronized with implementation.

Generate or update API documentation as endpoints change.
