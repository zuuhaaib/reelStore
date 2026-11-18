import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed } from './seed.ts';

// DB_PATH is configurable (":memory:" in tests); defaults to server/data/estore.db.
const dbPath = process.env.DB_PATH ?? fileURLToPath(new URL('../data/estore.db', import.meta.url));
if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });

/** Singleton connection: ES modules are evaluated once, so every DAO shares this instance. */
export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

/** Runs fn inside one transaction; rolls back if it throws. */
export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// Seed only an empty database, so orders and accounts survive restarts.
const { n } = db.prepare('SELECT COUNT(*) AS n FROM item').get() as { n: number };
if (n === 0) await seed(db);
