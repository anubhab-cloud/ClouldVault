# CloudVault - Agent Instructions

## 1. Project Identity
CloudVault is a public, cross-platform mobile application
for managing photos and videos across multiple connected
cloud accounts.

Platforms: Android and iOS.

## 2. Technology Stack
Mobile:
- React Native
- Expo
- TypeScript
- Expo Router
- TanStack Query
- Zustand

Backend:
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM

Infrastructure:
- Redis and BullMQ when background jobs are needed
- EAS Build
- GitHub
- Sentry

Cloud integrations:
- Google Drive API
- Google Photos Picker API

## 3. Architecture Rules
- Follow modular architecture.
- Separate mobile and backend applications.
- Keep provider integrations isolated.
- Use reusable components.
- Use strict TypeScript.
- Keep business logic outside UI components.
- Follow REST API conventions.
- Document significant architectural decisions.

## 4. Security Rules
- Never expose Google client secrets.
- Never store Google refresh tokens in the mobile app.
- Encrypt provider credentials at rest.
- Validate OAuth state and authorization.
- Enforce user-level authorization on every API.
- Never trust user IDs supplied by clients.
- Never log tokens or sensitive personal information.
- Use minimum necessary OAuth scopes.
- Support token revocation and account disconnection.

## 5. Google API Rules
- Never assume unrestricted Google Photos access.
- Google Photos Picker is selection-based.
- Picker media access can expire.
- Drive file scope must match actual user authorization.
- drive.file does not mean access to every existing Drive file.
- drive.readonly is a restricted scope.
- Never invent API capabilities.
- Consult current official Google documentation.

## 6. Development Rules
- Work milestone by milestone.
- Inspect existing code before changing it.
- Do not rewrite working features unnecessarily.
- Run linting and type checks after changes.
- Add tests for new functionality.
- Explain dependencies before installing them.
- Ask before destructive operations.
- Never introduce unnecessary infrastructure.

## 7. Git Rules
- Never push directly to main.
- Use feature branches.
- Keep commits focused.
- Review diffs before merging.
- Never commit .env files or credentials.

## 8. Documentation
Read relevant documents in /docs before implementing
a feature.

Keep documentation synchronized with code changes.

Update API specifications when endpoints change.
Update database documentation when schemas change.

## 9. Current Development Priority
Milestone 1: Project foundation and mobile UI.

Do not implement all milestones at once.

## 10. Agent Responsibilities
Before implementation:
1. Understand the requirement.
2. Inspect relevant files.
3. Propose a plan.
4. Identify risks.
5. Wait for approval for major architectural changes.

After implementation:
1. Run relevant tests.
2. Run TypeScript checks.
3. Report modified files.
4. Report remaining issues.
