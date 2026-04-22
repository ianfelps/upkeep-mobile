# CLAUDE.md — guia para agentes

Este arquivo orienta Claude/outros agentes ao trabalhar neste repositório. Mantenha conciso.

## Contexto do projeto

App mobile Expo (React Native + TS) consumindo `upkeep-api` (.NET 8, `http://localhost:5003`). Arquitetura **offline-first**: SQLite local (Drizzle) é a fonte de verdade para a UI; um sync engine reconcilia com a API.

Escopo atual (v1): Eventos (CRUD completo), Perfil (editar, trocar senha, logout, excluir conta). Hábitos e Progresso são placeholders "Em breve".

## Stack resumida

Expo SDK 52 · Expo Router v4 · expo-sqlite + Drizzle · Zustand + TanStack Query v5 · react-hook-form + zod · ky · @gorhom/bottom-sheet v5 · reanimated 3 · dayjs (pt-br).

## Regras importantes

- **TypeScript strict com `noUncheckedIndexedAccess`**. Cuidado ao indexar arrays — use `?.` ou checagens.
- **Paths**: `@/*` mapeia para `src/*`.
- **Datas**: use sempre `src/utils/date.ts` (dayjs configurado). Formatos: `YYYY-MM-DD` para date keys, `HH:mm:ss` para horários, ISO UTC para timestamps.
- **IDs locais**: `newLocalId()` em `src/utils/id.ts` (ULID com PRNG `Math.random` — não trocar para `nodeCrypto`, não existe em RN).
- **Queries leem DB local**, nunca API direta. Mutations gravam local e chamam `schedulePostMutationSync()`.
- **Não adicione libs** sem necessidade clara. Já temos tudo para UI/forms/estado/sync.
- **Nunca commitar** sem o usuário pedir.

## Fluxo offline-first (críticos)

- `src/sync/syncEngine.ts` — `syncEngine.tick(reason)` com mutex; chama push então pull.
- `src/sync/pushQueue.ts` — drena `pending_create/update/delete`; 401 aborta (interceptor cuida).
- `src/sync/pullDelta.ts` — UPSERT com LWW por `updated_at`.
- `src/sync/triggers.ts` — AppState, NetInfo, login, post-mutation (debounce 300ms).
- `src/api/authInterceptor.ts` — mutex para refresh em 401.
- `src/db/schema.ts` — mudança aqui exige `npm run db:generate` e revisão da migration gerada em `drizzle/`.

## Comandos úteis

```bash
npm run typecheck        # tsc --noEmit (rode antes de concluir tarefas)
npm test                 # jest
npm run db:generate      # após alterar src/db/schema.ts
npx expo start -c        # Metro com cache limpo (resolve fast-refresh quebrado)
```

## Convenções

- **Componentes primitivos** em `src/components/` são exportados via `index.ts`. Use-os no lugar de RN puro quando houver equivalente (Button, TextField, Sheet, Banner, Toast, etc.).
- **Formulários**: RHF + zod (`@hookform/resolvers/zod`). Schemas em arquivos separados por feature (`src/features/<x>/schemas.ts`).
- **Modais**: `forwardRef` + `useImperativeHandle` expondo `{ open, close }`, envolvendo `<Sheet>`.
- **Toasts**: `import { toast } from '@/components'` → `toast.success / error / info`. Já wired em mutations.
- **Erros de API**: sempre passe por `getErrorMessage(err)` de `src/api/errors.ts`.
- **Tema**: usar tokens de `src/theme/` — não hard-code cores/spacing.

## Armadilhas conhecidas

- **Fast Refresh** às vezes falha ao converter componente entre função pura e `forwardRef`. Se aparecer erro "Component is not a function (it is Object)", reload total (`r` no Metro) ou `npx expo start -c`.
- **Expo Router `Tabs.Screen`** deve usar o nome exato do arquivo incluindo subpath (ex: `perfil/index`, não `perfil`).
- **SQL imports**: `drizzle/migrations.js` importa `.sql` — requer `babel-plugin-inline-import` em `babel.config.js` (já configurado). E `metro.config.js` precisa de `sourceExts.push('sql')`.
- **Android emulator**: `localhost` vira `10.0.2.2` automaticamente via `src/utils/env.ts`.

## Testes

Jest com preset `jest-expo`. Escrever specs para lógica pura (selectors, queues). Não testar UI nesta fase.

## Plano de desenvolvimento

O plano original está em `C:\Users\IAN\.claude\plans\vamos-iniciar-o-desenvolvimento-keen-lerdorf.md` — as 6 fases (scaffold, auth, DB+sync+Perfil, Eventos leitura, Eventos escrita, polimento) estão **concluídas**.
