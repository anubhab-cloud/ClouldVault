
# CloudVault - System Architecture

## 1. Architecture Style

Use a modular monolith architecture.

Do not introduce microservices during MVP development.

## 2. High-Level Architecture

Mobile Application:
React Native + Expo + TypeScript

        |
        | HTTPS / REST
        |
Backend API:
Node.js + Express + TypeScript

        |
        |--------------------|
        |                    |
PostgreSQL             Provider Services
        |                    |
Prisma ORM              Google Drive API
                             |
                        Google Photos Picker

Redis and BullMQ can be introduced for background
synchronization when required.

## 3. Mobile Architecture

Suggested structure:

mobile/
  app/
    (auth)/
    (tabs)/
    gallery/
    accounts/
    albums/
    settings/

  components/
    common/
    gallery/
    accounts/
    storage/

  features/
    authentication/
    gallery/
    accounts/
    albums/
    storage/

  hooks/
  services/
  store/
  theme/
  types/
  utils/

Responsibilities:

- app/: Navigation and route definitions.
- components/: Reusable UI.
- features/: Feature-specific logic.
- services/: Backend API clients.
- store/: Local application state.
- hooks/: Reusable React hooks.
- theme/: Design tokens and themes.

## 4. Backend Architecture

backend/src/

  config/
  middleware/
  modules/
    auth/
    users/
    accounts/
    photos/
    albums/
    storage/
    synchronization/

  integrations/
    google-drive/
    google-photos/

  common/
  utils/
  server.ts

Each module should contain appropriate:
- Controller
- Service
- Repository
- Validation
- Routes
- Tests

Do not force unnecessary layers into simple modules.

## 5. Provider Abstraction

Create a common provider interface.

Example responsibilities:

- authorizeAccount()
- refreshCredentials()
- listMedia()
- getMediaMetadata()
- getAuthorizedMediaAccess()
- revokeAccess()

Provider-specific functionality must remain
inside its integration module.

Google Photos Picker requires its own selection
and session lifecycle implementation.

Do not pretend both Google APIs provide identical
capabilities.

## 6. Data Flow

1. User signs in to CloudVault.
2. User connects a Google account.
3. Backend handles provider authorization.
4. Credentials are securely stored.
5. Backend fetches permitted media metadata.
6. Metadata is normalized.
7. Mobile app retrieves paginated results.
8. User opens an image.
9. Backend obtains authorized media access.
10. Mobile app renders the media.

## 7. Synchronization Architecture

Use incremental synchronization where supported.

Maintain:
- Provider account identifier.
- Last synchronization timestamp.
- Provider pagination cursor or token.
- Sync status.
- Last error.

Do not assume every provider offers the same
incremental synchronization mechanism.

## 8. Caching Strategy

Mobile:
- Expo Image caching.
- TanStack Query caching.
- Paginated metadata.

Backend:
- Cache non-sensitive metadata where appropriate.
- Avoid caching sensitive tokens in Redis.
- Use expiration for temporary provider data.

Never persist expired provider media URLs as
permanent image locations.

## 9. Deployment Architecture

Development:
- Local Expo application.
- Local backend.
- Development PostgreSQL.

Production:
- EAS mobile builds.
- Managed backend hosting.
- Managed PostgreSQL.
- Managed secrets service.
- Monitoring and error reporting.

## 10. Architecture Decision Rules

- Keep provider integrations replaceable.
- Avoid business logic inside UI components.
- Validate all API requests.
- Use typed contracts.
- Keep mobile and backend independent.
- Document architectural changes.
