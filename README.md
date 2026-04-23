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
| Ícones / Fonte | @expo/vector-icons 15 (Octicons, Feather, Ionicons, MaterialCommunityIcons) · Inter |
| Pickers | @react-native-community/datetimepicker |
| Conectividade | @react-native-community/netinfo |
| Animações | react-native-reanimated v3 · react-native-gesture-handler v2 |

## Funcionalidades

### Eventos
- CRUD completo com sync offline-first
- **Visualização dia**: timeline vertical com blocos de horário (estilo Google Calendar), swipe esquerda/direita para navegar entre dias
- **Visualização semana**: lista agrupada por dia
- **Visualização mês**: calendário em grade, segunda a domingo, chips coloridos por dia
- Cor por evento — paleta de 8 cores configurável no formulário
- Filtro de conexão: ícone discreto com Sheet modal mostrando estado offline ou fila de erros de sync

### Auth & Perfil
- Login / cadastro (com confirmação de senha)
- Editar nome/email, trocar senha, logout, excluir conta (dupla confirmação)
- Todos os campos de senha com toggle de visibilidade (olhinho)
- Diálogos de confirmação estilizados via `ConfirmSheet` (sem Alert nativo do Android)

### UX
- Splash screen com logo + tagline enquanto a sessão é validada
- Sync aguardado antes de navegar para eventos após login (evita flash de tela vazia)

## Pré-requisitos

- Node 20+
- `upkeep-api` rodando (`http://localhost:5003` por padrão)
- Android Studio com AVD, **ou** Xcode/iOS simulator
- No emulador Android, `localhost` é resolvido automaticamente para `10.0.2.2` via `src/utils/env.ts`

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
  index.tsx            splash/redirect por status de auth
  (auth)/              login, register
  (tabs)/              eventos, habitos, progresso, perfil
src/
  api/                 ky client, endpoints, auth interceptor, DTOs (zod)
  components/          primitivas UI (Button, TextField, Sheet, ConfirmSheet,
                         AppLogo, Toast, Banner, SegmentedControl, ...)
  db/                  schema, migrator, repositories (routineEvents, kv)
  features/
    auth/              login, register, session bootstrap
    events/            timeline, calendar, queries, selectors, form modal,
                         color picker, connection status icon
    profile/           edit, change password, logout, delete
  sync/                syncEngine (hasSynced), pushQueue, pullDelta, triggers
  theme/               colors, typography, spacing, radii, shadows
  utils/               date, id (ulid), env, secureStore, logger
drizzle/               migrations SQL geradas
__tests__/             Jest specs
```

## Offline-first — como funciona

- **Leitura**: queries leem o SQLite local (`useEventsForDay` / `useEventsInRange`). A UI nunca espera a rede.
- **Escrita otimista**: create/update/delete gravam local com `sync_status = pending_*` e disparam `schedulePostMutationSync()` (debounce 300ms).
- **Push queue** (`src/sync/pushQueue.ts`) drena pendentes por `updated_at ASC`: POST/PUT/DELETE na API, grava `remote_id` em sucesso, registra `sync_error` em falhas 4xx.
- **Pull delta** (`src/sync/pullDelta.ts`): `GET /routine-events?updatedSince={lastPulledAt}`, UPSERT por `remote_id` com LWW por `updated_at`.
- **Triggers** (`src/sync/triggers.ts`): login · AppState foreground · NetInfo offline→online · pós-mutação · pull-to-refresh.
- **Refresh token**: mutex em `src/api/authInterceptor.ts` garante um único refresh por rajada de 401s.
- **hasSynced()**: `syncEngine.hasSynced()` permite que telas saibam se ao menos um sync foi concluído, evitando flash de estado vazio antes dos dados chegarem.

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
