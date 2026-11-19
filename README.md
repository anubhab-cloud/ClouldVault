# CloudVault

### All your memories. One place.

CloudVault is a cross-platform mobile application designed to centralize photo and video management across multiple connected cloud accounts.

Users can connect multiple Google accounts, browse authorized media, organize collections, and monitor storage usage from one unified interface.

## Features

- **Multiple Google Account Management**: Connect independent Google accounts without credentials collision.
- **Unified Photo Gallery**: Aggregated, chronologically sorted media view with account/provider filtering.
- **Cloud Media Browsing**: High-performance grid and full-screen viewer with EXIF metadata inspection.
- **Album Organization**: Create and manage local virtual collections without mutating cloud provider files.
- **Account-wise Storage Dashboard**: Visibility into per-account storage usage and quota reporting.
- **Privacy & Security**: Zero client-side storage of provider refresh tokens, AES-256-GCM encryption on the backend.
- **Cross-Platform**: Built with React Native & Expo for Android and iOS.

## Technology Stack

### Mobile
- **Framework**: React Native & Expo (Expo Router v4+)
- **Language**: TypeScript
- **State Management**: TanStack Query (v5) & Zustand
- **Media & UI**: Expo Image, Expo UI, Lucide Icons

### Backend
- **Framework**: Node.js & Express.js
- **Language**: TypeScript
- **Database & ORM**: PostgreSQL & Prisma ORM
- **Security**: AES-256-GCM token encryption, JWT sessions, Zod schema validation

### Cloud Integrations
- Google Drive API (`drive.file` / `drive.readonly`)
- Google Photos Picker API (Interactive session-based selection)
- Google OAuth 2.0 with PKCE

## Project Structure

```text
CloudVault/
├── .agents/          # Installed agent skills
├── docs/             # Complete system & product specifications
├── packages/
│   └── types/        # Shared TypeScript contracts (@cloudvault/types)
├── mobile/           # Expo React Native mobile application
├── backend/          # Node.js + Express backend service
├── AGENTS.md         # Development instructions & architecture rules
└── README.md         # Project overview and setup instructions
```

## Getting Started

### Prerequisites
- Node.js LTS (v20+)
- npm or pnpm
- Expo Go or Android/iOS Emulator

### Mobile Setup
```bash
cd mobile
npm install
npx expo start
```

### Backend Setup
```bash
cd backend
npm install
# Configure .env variables
npx prisma migrate dev
npm run dev
```

## Documentation

Full architectural documentation is available in [`/docs`](./docs/):
- [PROJECT-OVERVIEW.md](./docs/PROJECT-OVERVIEW.md)
- [PRODUCT-REQUIREMENTS.md](./docs/PRODUCT-REQUIREMENTS.md)
- [SYSTEM-ARCHITECTURE.md](./docs/SYSTEM-ARCHITECTURE.md)
- [DATABASE-SCHEMA.md](./docs/DATABASE-SCHEMA.md)
- [API-SPECIFICATION.md](./docs/API-SPECIFICATION.md)
- [UI-UX-GUIDELINES.md](./docs/UI-UX-GUIDELINES.md)
- [SECURITY-AND-OAUTH.md](./docs/SECURITY-AND-OAUTH.md)
- [DEVELOPMENT-ROADMAP.md](./docs/DEVELOPMENT-ROADMAP.md)
- [TESTING-STRATEGY.md](./docs/TESTING-STRATEGY.md)

## License
Proprietary - All rights reserved.
