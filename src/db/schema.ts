import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const routineEvents = sqliteTable(
  'routine_events',
  {
    localId: text('local_id').primaryKey(),
    remoteId: text('remote_id'),
    title: text('title').notNull(),
    description: text('description'),
    startTime: text('start_time').notNull(),
    endTime: text('end_time'),
    daysOfWeek: text('days_of_week'),
    eventDate: text('event_date'),
    eventType: text('event_type', { enum: ['once', 'recurring'] }).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    userId: text('user_id').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    syncStatus: text('sync_status', {
      enum: ['synced', 'pending_create', 'pending_update', 'pending_delete'],
    })
      .notNull()
      .default('synced'),
    lastSyncedAt: text('last_synced_at'),
    syncError: text('sync_error'),
    syncAttempts: integer('sync_attempts').notNull().default(0),
  },
  (table) => ({
    remoteIdIdx: uniqueIndex('routine_events_remote_id_idx').on(table.remoteId),
    syncStatusIdx: index('routine_events_sync_status_idx').on(table.syncStatus),
    eventDateIdx: index('routine_events_event_date_idx').on(table.eventDate),
    updatedAtIdx: index('routine_events_updated_at_idx').on(table.updatedAt),
    userIdIdx: index('routine_events_user_id_idx').on(table.userId),
  })
);

export const kv = sqliteTable('kv', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type RoutineEventRow = typeof routineEvents.$inferSelect;
export type NewRoutineEventRow = typeof routineEvents.$inferInsert;
export type KvRow = typeof kv.$inferSelect;
