# CLAUDE.md — agent guide

This file guides Claude and other agents when working in this repository. Keep it concise.

## Project context

Expo mobile app (React Native + TS) consuming `upkeep-api` (.NET 8, `http://localhost:5003`). **Offline-first** architecture: local SQLite (Drizzle) is the source of truth for the UI; a sync engine reconciles with the API in the background.

Current scope (v1): Events (full CRUD), Profile (edit, change password, logout, delete account). Habits and Progress are "coming soon" placeholders.

## Stack

Expo SDK 52 · Expo Router v4 · expo-sqlite + Drizzle · Zustand + TanStack Query v5 · react-hook-form + zod · ky · @gorhom/bottom-sheet v5 · reanimated 3 · react-native-gesture-handler v2 · dayjs (pt-br) · @expo/vector-icons 15.

## Important rules

- **TypeScript strict with `noUncheckedIndexedAccess`**. Be careful when indexing arrays — use `?.` or explicit checks.
- **Paths**: `@/*` maps to `src/*`.
- **Dates**: always use `src/utils/date.ts` (configured dayjs). Formats: `YYYY-MM-DD` for date keys, `HH:mm:ss` for times, ISO UTC for timestamps.
- **Local IDs**: `newLocalId()` in `src/utils/id.ts` (ULID with `Math.random` PRNG — do not switch to `nodeCrypto`, it doesn't exist in RN).
- **Queries read local DB**, never the API directly. Mutations write locally then call `schedulePostMutationSync()`.
- **Do not add libraries** without a clear need. We already have everything for UI/forms/state/sync.
- **Never commit** without the user asking.

## Offline-first flow (critical paths)

- `src/sync/syncEngine.ts` — `syncEngine.tick(reason)` with mutex; calls push then pull. Exposes `syncEngine.hasSynced()` — returns true after at least one sync has completed; use this to gate UI that should wait for initial data.
- `src/sync/pushQueue.ts` — drains `pending_create/update/delete`; 401 aborts (interceptor handles token refresh).
- `src/sync/pullDelta.ts` — UPSERT with LWW by `updated_at`.
- `src/sync/triggers.ts` — AppState, NetInfo, login, post-mutation (debounce 300ms).
- `src/api/authInterceptor.ts` — mutex for refresh on 401.
- `src/db/schema.ts` — changes here require `npm run db:generate` and review of the generated migration in `drizzle/`.

## Useful commands

```bash
npm run typecheck        # tsc --noEmit (run before finishing tasks)
npm test                 # jest
npm run db:generate      # after changing src/db/schema.ts
npx expo start -c        # Metro with clean cache (fixes broken fast-refresh)
```

## Conventions

- **Primitive components** in `src/components/` are exported via `index.ts`. Use them instead of raw RN when an equivalent exists (Button, TextField, Sheet, ConfirmSheet, Banner, Toast, AppLogo, etc.).
- **Forms**: RHF + zod (`@hookform/resolvers/zod`). Schemas in separate files per feature (`src/features/<x>/schemas.ts`).
- **Modals**: `forwardRef` + `useImperativeHandle` exposing `{ open, close }`, wrapping `<Sheet>`.
- **Confirmation dialogs**: use `<ConfirmSheet>` (styled bottom sheet) — never `Alert.alert`. Supports `tone="destructive"` for destructive actions.
- **Password fields**: always add `showPasswordToggle` prop to `<TextField>` when `secureTextEntry` is set. The eye icon toggle is built into `TextField`.
- **Toasts**: `import { toast } from '@/components'` → `toast.success / error / info`. Already wired in mutations.
- **API errors**: always pass through `getErrorMessage(err)` from `src/api/errors.ts`.
- **Theme**: use tokens from `src/theme/` — do not hard-code colors/spacing.
- **Icons**: `Feather` for general UI icons, `Octicons` for the AppLogo (`sparkle`). All from `@expo/vector-icons` (v15).

## Events feature

- **Filters**: `day` | `week` | `month` (no `threeDays`).
- **Day view**: `TimelineView` — vertical 24h grid, swipe left/right to navigate days, auto-scroll to current time on mount via `contentOffset`.
- **Week view**: `SectionList` grouped by day.
- **Month view**: `MonthCalendarView` — Monday-first grid, colored chips/dots per day, tap day → switches to day view.
- **Event color**: `color` field (hex string, nullable). Palette of 8 colors in `src/features/events/constants.ts`. Use `resolveEventColor` / `resolveEventBg` helpers.
- **Connection status**: `ConnectionStatusIcon` — discrete icon in header. Opens Sheet with offline info or sync error queue. No banners.
- **Query keys**: `eventsQueryKeys.all = ['events']` invalidates all event queries. `eventsQueryKeys.day(dateKey)` for timeline, `eventsQueryKeys.range(from, to)` for week/month.
- **First-load guard**: `EventosScreen` uses `syncEngine.hasSynced()` to initialize `syncDone` state. Spinner shown until sync has completed at least once AND the query has data or has finished fetching.

## Known pitfalls

- **Fast Refresh** sometimes fails when converting between plain function and `forwardRef`. If "Component is not a function (it is Object)" appears, do a full reload (`r` in Metro) or `npx expo start -c`.
- **Expo Router `Tabs.Screen`** must use the exact file name including subpath (e.g. `perfil/index`, not `perfil`).
- **SQL imports**: `drizzle/migrations.js` imports `.sql` — requires `babel-plugin-inline-import` in `babel.config.js` (already configured). And `metro.config.js` needs `sourceExts.push('sql')`.
- **Android emulator**: `localhost` becomes `10.0.2.2` automatically via `src/utils/env.ts`.
- **`@expo/vector-icons`**: currently at v15.1.1. Octicons `sparkle` is available from this version onward.

## Tests

Jest with `jest-expo` preset. Write specs for pure logic (selectors, queues). Do not test UI at this stage.

## Development plan

The original plan is at `C:\Users\IAN\.claude\plans\vamos-iniciar-o-desenvolvimento-keen-lerdorf.md` — all 6 phases (scaffold, auth, DB+sync+Profile, Events read, Events write, polish) are **complete**.
