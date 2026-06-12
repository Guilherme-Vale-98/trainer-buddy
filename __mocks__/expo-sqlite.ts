import Database from 'better-sqlite3';

type Params = unknown[];

class FakeSQLiteDatabase {
  constructor(private readonly db: InstanceType<typeof Database>) {}

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, params: Params = []): Promise<void> {
    this.db.prepare(sql).run(...params);
  }

  async getFirstAsync<T>(sql: string, params: Params = []): Promise<T | null> {
    return (this.db.prepare(sql).get(...params) as T | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, params: Params = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }
}

export async function openDatabaseAsync(_name: string): Promise<FakeSQLiteDatabase> {
  return new FakeSQLiteDatabase(new Database(':memory:'));
}

export type SQLiteDatabase = FakeSQLiteDatabase;
