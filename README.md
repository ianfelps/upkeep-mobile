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
- **Visualização dia**: timeline vertical com blocos de horário (estilo Google Calendar), swipe esquerda/direita para navegar entre dias. Tap em um bloco abre `EventActionsSheet` com detalhes ricos (tipo, data, dias da semana, descrição, hábitos vinculados, botão editar).
- **Visualização semana**: lista agrupada por dia, com chips de hábitos vinculados em cada evento
- **Visualização mês**: calendário em grade, segunda a domingo, chips coloridos por dia
- Cor por evento — paleta de 8 cores configurável no formulário
- Filtro de conexão: ícone discreto com Sheet modal mostrando estado offline ou fila de erros de sync

### Hábitos
- CRUD completo com sync offline-first
- **Heatmap estilo GitHub** (53 semanas × 7 dias) com filtro de período (`1m / 6m / 1a`), auto-scroll para os dias mais recentes ao abrir
- **Heatmap global** no topo da lista + **heatmap individual** na tela de detalhe de cada hábito
- **Conclusão em 1 toque**: botão circular no card cria/remove log `Completed` para hoje
- **Backfill**: tocar em qualquer célula passada do heatmap abre sheet para registrar status (Concluído/Pulado/Perdido) + notas
- **Vínculo com eventos recorrentes**: hábitos podem ser vinculados a um ou mais eventos. Chips do hábito aparecem na linha/sheet do evento — tap marca o hábito como concluído para a data daquele evento
- Estatísticas no detalhe: sequência atual, recorde, total e taxa de conclusão dos últimos 30 dias
- Picker de ícone (24 ícones Feather curados, scroll horizontal) e cor (mesma paleta dos eventos)
- Frequência: Diário / Semanal / Mensal · meta configurável por período

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
  (tabs)/              eventos, habitos/{index,[localId]}, progresso, perfil
src/
  api/                 ky client, endpoints (routineEvents, habits, habitLogs),
                         auth interceptor, DTOs (zod)
  components/          primitivas UI (Button, TextField, Sheet, ConfirmSheet,
                         AppLogo, Toast, Banner, SegmentedControl, ...)
  db/                  schema, migrator,
                         repositories (routineEvents, habits, habitLogs, kv)
  features/
    auth/              login, register, session bootstrap
    events/            timeline, calendar, queries, selectors, form modal,
                         actions sheet, color picker, connection status icon
    habits/            list/detail screens, heatmap, card com toggle,
                         form modal, icon/color/linked-events pickers,
                         log edit sheet, selectors (heatmap + stats)
    profile/           edit, change password, logout, delete
  sync/                syncEngine (hasSynced), pushQueue (events→habits→logs),
                         pullDelta (per-resource cursors), triggers
  theme/               colors, typography, spacing, radii, shadows
  utils/               date, id (ulid), env, secureStore, logger
drizzle/               migrations SQL geradas
__tests__/             Jest specs (expandRecurrence, habitsSelectors)
```

## Offline-first — como funciona

- **Leitura**: queries leem o SQLite local (`useEventsForDay`, `useHabitsList`, `useGlobalHeatmap`, etc.). A UI nunca espera a rede.
- **Escrita otimista**: create/update/delete gravam local com `sync_status = pending_*` e disparam `schedulePostMutationSync()` (debounce 300ms).
- **Push queue** (`src/sync/pushQueue.ts`) drena pendentes em ordem **eventos → hábitos → logs**, por `updated_at ASC`: POST/PUT/DELETE na API, grava `remote_id` em sucesso, registra `sync_error` em falhas 4xx. Logs de hábito aguardam o `remote_id` do hábito pai antes de subir.
- **Pull delta** (`src/sync/pullDelta.ts`): mesmas três fases, com cursores por recurso (`sync.lastPulledAt.{events,habits,habitLogs}`). UPSERT por `remote_id` com LWW por `updated_at`. Para hábitos, faz 1 chamada `GET /habits/{id}/logs?updatedSince=` por hábito ativo.
- **Triggers** (`src/sync/triggers.ts`): login · AppState foreground · NetInfo offline→online · pós-mutação · pull-to-refresh.
- **Refresh token**: mutex em `src/api/client.ts` garante um único refresh por rajada de 401s.
- **hasSynced()**: `syncEngine.hasSynced()` permite que telas saibam se ao menos um sync foi concluído, evitando flash de estado vazio antes dos dados chegarem.

Requisito do backend:
- API precisa ter `JsonStringEnumConverter` registrado em `Program.cs` — payloads de hábito/log mandam enums como string (`"Daily"`, `"Completed"`).

Gaps conhecidos:
- Deletes remotos cross-device dependem de full-reconcile 24h (API sem tombstones).
- Sync em background (BGTask / WorkManager) fica para v2.
- `ConnectionStatusIcon` ainda só conta erros de `routine_events`; erros em hábitos/logs aparecem só via toast.

## Testes

```bash
npm test
```

Cobertura atual:
- `__tests__/expandRecurrence.spec.ts` — expansão de recorrência, `resolveRange`, `shiftAnchor`, `groupByDay`.
- `__tests__/habitsSelectors.spec.ts` — heatmap (global e por hábito), cálculo de streak/stats, decoração `completedToday`.

## Tema

Paleta laranja quente sobre neutros stone. Tokens em `src/theme/` (`colors`, `typography`, `spacing`, `radii`, `shadows`).
