import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../../drizzle/migrations';
import { getDatabase } from './client';

export function useDatabaseMigrations() {
  return useMigrations(getDatabase(), migrations);
}
