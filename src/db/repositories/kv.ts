import { eq } from 'drizzle-orm';
import { getDatabase } from '../client';
import { kv } from '../schema';
import { nowIsoUtc } from '@/utils/date';

export type KvKey =
  | 'sync.lastPulledAt'
  | 'sync.lastPulledAt.events'
  | 'sync.lastPulledAt.habits'
  | 'sync.lastPulledAt.habitLogs'
  | 'sync.lastFullReconcileAt'
  | 'auth.userId';

export async function kvGet(key: KvKey): Promise<string | null> {
  const db = getDatabase();
  const rows = await db.select().from(kv).where(eq(kv.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function kvSet(key: KvKey, value: string): Promise<void> {
  const db = getDatabase();
  const now = nowIsoUtc();
  await db
    .insert(kv)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({
      target: kv.key,
      set: { value, updatedAt: now },
    });
}

export async function kvDelete(key: KvKey): Promise<void> {
  const db = getDatabase();
  await db.delete(kv).where(eq(kv.key, key));
}
