
# CloudVault - Database Schema

## 1. Database

Use PostgreSQL with Prisma ORM.

All database identifiers should use UUIDs.

Store timestamps in UTC.

Use appropriate indexes and foreign keys.

## 2. Main Entities

### User
Stores CloudVault user information.

Fields:
- id
- email
- name
- passwordHash (nullable for social-only authentication)
- createdAt
- updatedAt

### UserSession
Stores application sessions.

Fields:
- id
- userId
- refreshTokenHash
- expiresAt
- revokedAt
- createdAt

### ConnectedAccount
Stores external provider accounts.

Fields:
- id
- userId
- provider
- providerAccountId
- email
- status
- createdAt
- updatedAt

Unique constraint:
(userId, provider, providerAccountId)

### OAuthCredential
Stores encrypted provider credentials.

Fields:
- id
- connectedAccountId
- encryptedRefreshToken
- encryptionKeyVersion
- grantedScopes
- expiresAt
- updatedAt

Never store raw refresh tokens.

### Photo
Stores normalized media metadata.

Fields:
- id
- connectedAccountId
- providerMediaId
- filename
- mimeType
- mediaType (enum: 'image', 'video')
- sizeBytes (BigInt)
- capturedAt (Timestamp with timezone, indexed for chronological gallery sort)
- createdAt
- updatedAt
- metadataJson (camera, focal length, ISO, exposure, location, dimensions)

Unique constraint:
(connectedAccountId, providerMediaId)

Do not assume every provider returns the same metadata.

### Album
Stores CloudVault collections.

Fields:
- id
- userId
- name
- description
- createdAt
- updatedAt

### AlbumPhoto
Connects albums and photos.

Fields:
- albumId
- photoId
- addedAt

Composite primary key:
(albumId, photoId)

Ensure album and photo belong to the same user.

### SyncJob
Tracks synchronization operations.

Fields:
- id
- connectedAccountId
- status
- startedAt
- completedAt
- errorCode
- errorMessage

### ProviderSyncState
Tracks provider synchronization state.

Fields:
- id
- connectedAccountId
- providerCursor
- lastSyncedAt
- updatedAt

### StorageUsage
Stores account-wise storage snapshots.

Fields:
- id
- connectedAccountId
- usedBytes
- quotaBytes
- availableBytes
- source
- measuredAt

All usage fields should support nullable values
when provider information is unavailable.

### AuditEvent
Stores important security events.

Fields:
- id
- userId
- eventType
- metadata
- createdAt

Never include access tokens or secrets.

## 3. Relationships

User:
- Has many ConnectedAccounts.
- Has many UserSessions.
- Has many Albums.
- Has many AuditEvents.

ConnectedAccount:
- Belongs to User.
- Has one OAuthCredential.
- Has many Photos.
- Has many SyncJobs.
- Has many StorageUsage snapshots.

Photo:
- Belongs to ConnectedAccount.
- Has many AlbumPhoto relations.

## 4. Database Rules

- Enforce user ownership.
- Use cascading deletes carefully.
- Use transactions for related operations.
- Add indexes for gallery pagination.
- Prevent duplicate provider media records.
- Store file sizes as BigInt.
- Store provider-specific metadata safely.
- Never store binary photo files in PostgreSQL.

## 5. Data Retention

When a Google account is disconnected:
- Revoke provider authorization where possible.
- Delete encrypted credentials.
- Stop synchronization jobs.
- Remove or invalidate associated provider data.
- Preserve only data that the user explicitly chooses
  to retain and that policy permits.

When a CloudVault user deletes their account:
- Revoke connected credentials.
- Delete personal metadata and sessions.
- Process deletion requests consistently.
- Record minimal permitted audit information.

## 6. Migration Rules

Every schema change must use Prisma migrations.

Never modify production schema manually.

Test migrations against development data first.

Document breaking schema changes.
