# upkeep-mobile

App mobile do Upkeep em React Native + Expo (TypeScript). Consome a API irmã [`upkeep-api`](../upkeep-api) (.NET 8) com arquitetura **offline-first**: leitura e escrita ocorrem no SQLite local e um engine de sync reconcilia com o backend em background.

## Stack

| Área | Escolha |
|---|---|
| Base | Expo SDK 52, New Architecture, TypeScript strict |
| Navegação | Expo Router v4 (file-based) — grupos `(auth)` / `(tabs)` |
| DB local | expo-sqlite + Drizzle ORM + drizzle-kit |
| Estado | Zustand (auth) · TanStack Query v5 (queryFns leem o DB local) |
| Forms | react-hook-form + zod |
| HTTP | ky (mutex de refresh em 401) |
| Tokens | expo-secure-store (refresh) · access token em memória |
| Modais | @gorhom/bottom-sheet v5 |
| Datas | dayjs (utc, timezone, isBetween, weekday), locale pt-br |
| Ícones / Fonte | Feather (@expo/vector-icons) · Inter |
| Pickers | @react-native-community/datetimepicker |
| Conectividade | @react-native-community/netinfo |
| Animações | react-native-reanimated v3 |

## Pré-requisitos

- Node 20+
- `upkeep-api` rodando (`http://localhost:5003` por padrão)
- Android Studio com um AVD, **ou** Xcode/iOS simulator
- No emulador Android, `localhost` é resolvido automaticamente para `10.0.2.2` em `src/utils/env.ts`.

## Setup

```bash
npm install
cp .env.example .env     # ajuste EXPO_PUBLIC_API_URL se necessário
npm start                # ou: npm run android / npm run ios
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o Metro bundler |
| `npm run android` / `ios` | Abre no emulador |
| `npm test` | Roda os testes Jest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Gera migrations Drizzle a partir de `src/db/schema.ts` |

## Estrutura

```
app/                   rotas (Expo Router)
  (auth)/              login, register
  (tabs)/              eventos, habitos, progresso, perfil
src/
  api/                 ky client, endpoints, auth interceptor, DTOs (zod)
  components/          primitivas UI (Button, TextField, Sheet, Toast, ...)
  db/                  schema, migrator, repositories (routineEvents, kv)
  features/
    auth/              login, register, session bootstrap
    events/            queries, mutations, selectors, form, banners
    profile/           edit, change password, logout, delete
  sync/                syncEngine, pushQueue, pullDelta, triggers
  theme/               colors, typography, spacing, radii, shadows
  utils/               date, id (ulid), env, secureStore, logger
drizzle/               migrations SQL geradas
__tests__/             Jest specs
```

## Offline-first — como funciona

- **Leitura**: queries leem o SQLite local (`useEventsInRange` -> `findInRange` + `expandRecurrence`). A UI nunca espera a rede.
- **Escrita otimista**: create/update/delete gravam local com `sync_status = pending_*` e disparam `schedulePostMutationSync()` (debounce 300ms).
- **Push queue** (`src/sync/pushQueue.ts`) drena pendentes por `updated_at ASC`: POST/PUT/DELETE na API, grava `remote_id` em sucesso, registra `sync_error` em falhas 4xx.
- **Pull delta** (`src/sync/pullDelta.ts`): `GET /routine-events?updatedSince={lastPulledAt}`, UPSERT por `remote_id` com LWW por `updated_at`.
- **Triggers** (`src/sync/triggers.ts`): login · AppState foreground · NetInfo offline->online · pós-mutação · pull-to-refresh.
- **Refresh token**: mutex em `src/api/authInterceptor.ts` garante um único refresh por rajada de 401s.

Gaps conhecidos:
- Deletes remotos cross-device dependem de full-reconcile 24h (API sem tombstones).
- Sync em background (BGTask / WorkManager) fica para v2.
- Dark mode: só claro na v1.

## Testes

```bash
npm test
```

Cobertura atual: `__tests__/expandRecurrence.spec.ts` (expansão de recorrência, `resolveRange`, `shiftAnchor`, `groupByDay`).

## Tema

Paleta laranja quente sobre neutros stone. Tokens em `src/theme/` (`colors`, `typography`, `spacing`, `radii`, `shadows`).
