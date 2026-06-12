import * as SQLite from 'expo-sqlite';

const SCHEMA = `
create table if not exists plans (
  id text primary key,
  created_at text not null,
  data text not null
);
create table if not exists sessions (
  id text primary key,
  status text not null,
  started_at text not null,
  finished_at text null,
  data text not null
);
`;

export type Db = SQLite.SQLiteDatabase;

export async function openDatabase(name = 'trainer-buddy.db'): Promise<Db> {
  const db = await SQLite.openDatabaseAsync(name);
  await db.execAsync(SCHEMA);
  return db;
}

let defaultDb: Promise<Db> | null = null;

export function getDatabase(): Promise<Db> {
  if (!defaultDb) defaultDb = openDatabase();
  return defaultDb;
}
