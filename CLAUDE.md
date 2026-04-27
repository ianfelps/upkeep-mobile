# CLAUDE.md — agent guide

This file guides Claude and other agents when working in this repository. Keep it concise.

## Project context

Expo mobile app (React Native + TS) consuming `upkeep-api` (.NET 8, `http://localhost:5003`). **Offline-first** architecture: local SQLite (Drizzle) is the source of truth for the UI; a sync engine reconciles with the API in the background.

Current scope (v1): Events (full CRUD), Habits (full CRUD + GitHub-style heatmap + 1-tap completion + link to recurring events), Profile (edit, change password, logout, delete account). Progress is a "coming soon" placeholder.

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

## Habits feature

- **Tables**: `habits` and `habit_logs` in `src/db/schema.ts`. `habits.linkedRoutineEventIds` stores a JSON array of event **remoteIds** (resolved at read time via `routine_events.remote_id`). `habit_logs` is unique per `(habitLocalId, targetDate)` — enforced in repo (`findForHabitOnDate` before insert).
- **Frequency / Status enums**: API uses string enums (`Daily`/`Weekly`/`Monthly`, `Completed`/`Skipped`/`Missed`); local DB stores lowercase. Map via `frequencyDbToApi` / `statusDbToApi` in repos. Backend requires `JsonStringEnumConverter` registered in `Program.cs` — without it, push fails with 400 and habits stay `pending_create` forever.
- **Sync extension**: `pushQueue.ts` runs three resources sequentially (events → habits → habitLogs). Habit logs need their habit's `remoteId` to push (POST `/habits/{id}/logs`); if not synced yet, log is deferred to next tick. `pullDelta.ts` mirrors this: events → habits → habitLogs (1 call per active habit). Per-resource KV cursors: `sync.lastPulledAt.{events,habits,habitLogs}` (legacy `sync.lastPulledAt` migrated on first run).
- **Icons**: store the Feather icon name string in `habits.icon`. Curated list in `src/features/habits/constants.ts` (`FEATHER_ICON_OPTIONS`). Backend column was renamed from `LucideIcon` to `Icon` — see migration `RenameLucideIconToIcon`.
- **Colors**: reuse `EVENT_COLORS` palette via `HABIT_COLORS` re-export.
- **Heatmap**: built locally from `habit_logs` (never call `GET /habits/heatmap`). Selectors `buildGlobalHeatmap` / `buildHabitHeatmap` in `selectors.ts`. Component `HabitsHeatmap` is a 53×7 grid; auto-scrolls to the right (most recent days) on mount. Period filter: `1m / 6m / 1a` segmented control on both global (HabitsScreen) and per-habit (HabitDetailScreen) heatmaps.
- **1-tap completion**: `HabitCard` toggle button → `useToggleHabitToday` creates/deletes a `Completed` log for today. Backfill: tap any past cell on the heatmap → `LogEditSheet` opens (status + notes).
- **Habit ↔ Event link**: `EventLinkedHabits` chips appear inside `EventRow` (week/month) and inside `EventActionsSheet` (day/timeline). Tap chip → toggles `Completed` log for that habit on that event's `dateKey`. `HabitDetailScreen` shows linked event titles in a dedicated section.
- **Timeline tap**: `TimelineView` blocks open `EventActionsSheet` (not the form directly). Sheet has hero with type indicator, time/date meta cards, weekday chips for recurring events, description, linked habits with toggle, and "Editar evento" button.
- **Form scroll**: `HabitFormModal` uses `BottomSheetScrollView` (gorhom) with footer (Cancelar/Salvar) **inside** the scroll — putting it outside breaks layout in gorhom v5. Horizontal scrolls inside bottom sheets must use `ScrollView` from `react-native-gesture-handler` (not the RN one), otherwise gestures are intercepted by the sheet.
- **Query keys**: `habitsQueryKeys.all = ['habits']` invalidates everything (list, detail, heatmap, linked queries). Mutations always invalidate `.all`.

## Events feature

- **Filters**: `day` | `week` | `month` (no `threeDays`).
- **Day view**: `TimelineView` — vertical 24h grid, swipe left/right to navigate days, auto-scroll to current time on mount via `contentOffset`.
- **Week view**: `SectionList` grouped by day.
- **Month view**: `MonthCalendarView` — Monday-first grid, colored chips/dots per day, tap day → switches to day view.
- **Event color**: `color` field (hex string, nullable). Palette of 8 colors in `src/features/events/constants.ts`. Use `resolveEventColor` / `resolveEventBg` helpers.
- **Connection status**: `ConnectionStatusIcon` — discrete icon in header. Opens Sheet with offline info or sync error queue. No banners. Mounted in both `EventosScreen` and `HabitsScreen` headers (currently reads only `routine_events` errors — not generalized to habits/logs yet).
- **Day view tap**: opens `EventActionsSheet` (rich detail + linked habits toggle), not the edit form directly. Edit form opens from inside that sheet.
- **Query keys**: `eventsQueryKeys.all = ['events']` invalidates all event queries. `eventsQueryKeys.day(dateKey)` for timeline, `eventsQueryKeys.range(from, to)` for week/month.
- **First-load guard**: `EventosScreen` uses `syncEngine.hasSynced()` to initialize `syncDone` state. Spinner shown until sync has completed at least once AND the query has data or has finished fetching.

## Known pitfalls

- **Fast Refresh** sometimes fails when converting between plain function and `forwardRef`. If "Component is not a function (it is Object)" appears, do a full reload (`r` in Metro) or `npx expo start -c`.
- **Expo Router `Tabs.Screen`** must use the exact file name including subpath (e.g. `perfil/index`, not `perfil`).
- **SQL imports**: `drizzle/migrations.js` imports `.sql` — requires `babel-plugin-inline-import` in `babel.config.js` (already configured). And `metro.config.js` needs `sourceExts.push('sql')`.
- **Android emulator**: `localhost` becomes `10.0.2.2` automatically via `src/utils/env.ts`.
- **`@expo/vector-icons`**: currently at v15.1.1. Octicons `sparkle` is available from this version onward.
- **Backend enum binding**: ASP.NET Core defaults to integer enums on JSON. `Program.cs` adds `JsonStringEnumConverter` so DTOs accept `"Daily"`, `"Completed"`, etc. — never remove this without also switching the mobile payloads to ints.
- **Bottom sheet + ScrollView**: inside a `Sheet`/`BottomSheetModal`, use `BottomSheetScrollView` for the main vertical scroll. Nested horizontal scrolls (e.g. icon picker) must use `ScrollView` from `react-native-gesture-handler` — the RN one is silently swallowed by the sheet's gesture handler. Footers should live **inside** the scroll, not as siblings, otherwise they disappear under the keyboard.

## Tests

Jest with `jest-expo` preset. Write specs for pure logic (selectors, queues). Do not test UI at this stage.

## Development plan

The original plan is at `C:\Users\IAN\.claude\plans\vamos-iniciar-o-desenvolvimento-keen-lerdorf.md` — all 6 phases (scaffold, auth, DB+sync+Profile, Events read, Events write, polish) are **complete**. The Habits feature was added in a follow-up; plan at `C:\Users\User\.claude\plans\c-users-user-projetos-upkeep-app-upkeep-cryptic-lark.md`.
