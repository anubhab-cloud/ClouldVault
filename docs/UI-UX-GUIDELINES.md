
# CloudVault - UI/UX Guidelines

## 1. Design Philosophy

Create a premium, modern and minimal mobile application.

Design inspiration:
- Google Photos
- Apple Photos
- Modern cloud storage applications

Do not copy their branding or proprietary UI.

## 2. Platforms

Support:
- Android
- iOS

Maintain platform-specific behavior where necessary.

## 3. Themes

Support:
- Dark theme
- Light theme
- System theme

Use consistent design tokens.

## 4. Color Direction

Suggested brand identity:

Primary:
Deep violet / indigo.

Dark background:
Near-black charcoal.

Light background:
Soft white.

Accent:
Purple-blue gradient used selectively.

Success:
Green.

Warning:
Amber.

Error:
Red.

Maintain readable contrast.

## 5. Typography

Use a consistent type scale.

Screen titles:
Large and prominent.

Section titles:
Medium emphasis.

Metadata:
Small and secondary.

Avoid unnecessarily dense screens.

## 6. Navigation

Use bottom tab navigation:

1. Home
2. Albums
3. Accounts
4. Settings

Additional screens:
- Photo viewer
- Video viewer
- Search
- Storage dashboard
- Account details
- Sync history

## 7. Home Screen

Must include:
- CloudVault branding.
- Search.
- Account filter.
- Photo grid.
- Date-based grouping.
- Sync status.
- Loading and empty states.

## 8. Accounts Screen

Must include:
- Connected account list.
- Account provider.
- Account email.
- Connection status.
- Storage information when available.
- Add account action.
- Disconnect action.

## 9. Gallery

Requirements:
- Responsive grid.
- Efficient thumbnail rendering.
- Lazy loading.
- Pagination.
- Smooth scrolling.
- Full-screen viewer.
- Accessible image descriptions.

Do not load original-resolution images into every grid cell.

## 10. Storage Dashboard

Display:
- Total known usage.
- Per-account usage.
- Available quota where known.
- Last measurement timestamp.
- Unknown usage states.

Distinguish estimated values from provider-reported values.

## 11. Interaction Design

Use:
- Clear loading indicators.
- Skeleton placeholders.
- Confirmation dialogs for destructive actions.
- Helpful error messages.
- Offline indicators.
- Accessible touch targets.

## 12. Reusable Components

Build reusable components:

- AppButton
- AppHeader
- PhotoCard
- PhotoGrid
- AccountCard
- StorageCard
- EmptyState
- LoadingState
- ErrorState
- SearchBar
- BottomNavigation

## 13. Performance

- Use Expo Image.
- Optimize image dimensions.
- Virtualize large lists.
- Avoid unnecessary rerenders.
- Cache metadata carefully.
- Handle memory pressure.

## 14. Accessibility

- Screen reader labels.
- Dynamic font support.
- Contrast compliance.
- Accessible navigation.
- Clear focus indicators.

## 15. Design Rule

Every screen must have:
- Loading state.
- Empty state.
- Error state.
- Success state where applicable.

Prioritize clarity over decorative effects.
