import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

let _sqlite: SQLiteDatabase | null = null;
let _db: ExpoSQLiteDatabase<typeof schema> | null = null;

export function getDatabase(): ExpoSQLiteDatabase<typeof schema> {
  if (!_db) {
    _sqlite = openDatabaseSync('upkeep.db', { enableChangeListener: false });
    _db = drizzle(_sqlite, { schema });
  }
  return _db;
}

export function getSqliteHandle(): SQLiteDatabase {
  if (!_sqlite) {
    getDatabase();
  }
  return _sqlite!;
}
