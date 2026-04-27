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
    color: text('color'),
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

export const habits = sqliteTable(
  'habits',
  {
    localId: text('local_id').primaryKey(),
    remoteId: text('remote_id'),
    title: text('title').notNull(),
    description: text('description'),
    icon: text('icon').notNull().default(''),
    color: text('color').notNull(),
    frequencyType: text('frequency_type', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
    targetValue: integer('target_value').notNull().default(1),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    linkedRoutineEventIds: text('linked_routine_event_ids'),
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
    remoteIdIdx: uniqueIndex('habits_remote_id_idx').on(table.remoteId),
    syncStatusIdx: index('habits_sync_status_idx').on(table.syncStatus),
    userIdIdx: index('habits_user_id_idx').on(table.userId),
    updatedAtIdx: index('habits_updated_at_idx').on(table.updatedAt),
  })
);

export const habitLogs = sqliteTable(
  'habit_logs',
  {
    localId: text('local_id').primaryKey(),
    remoteId: text('remote_id'),
    habitLocalId: text('habit_local_id').notNull(),
    habitRemoteId: text('habit_remote_id'),
    targetDate: text('target_date').notNull(),
    status: text('status', { enum: ['completed', 'skipped', 'missed'] }).notNull(),
    completedAt: text('completed_at'),
    notes: text('notes'),
    earnedXp: integer('earned_xp').notNull().default(0),
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
    remoteIdIdx: uniqueIndex('habit_logs_remote_id_idx').on(table.remoteId),
    syncStatusIdx: index('habit_logs_sync_status_idx').on(table.syncStatus),
    habitLocalIdx: index('habit_logs_habit_local_idx').on(table.habitLocalId),
    targetDateIdx: index('habit_logs_target_date_idx').on(table.targetDate),
    userIdIdx: index('habit_logs_user_id_idx').on(table.userId),
    updatedAtIdx: index('habit_logs_updated_at_idx').on(table.updatedAt),
  })
);

export const kv = sqliteTable('kv', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type RoutineEventRow = typeof routineEvents.$inferSelect;
export type NewRoutineEventRow = typeof routineEvents.$inferInsert;
export type HabitRow = typeof habits.$inferSelect;
export type NewHabitRow = typeof habits.$inferInsert;
export type HabitLogRow = typeof habitLogs.$inferSelect;
export type NewHabitLogRow = typeof habitLogs.$inferInsert;
export type KvRow = typeof kv.$inferSelect;
