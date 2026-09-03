import { open, type DB } from "@op-engineering/op-sqlite";

const DB_NAME = "dictionary.db";

let db: DB | null = null;
let ready: Promise<DB> | null = null;

/**
 * Opens the database and creates the schema on first call; later calls reuse the same
 * promise. Every query in db/words.ts awaits this, so no caller has to care whether
 * the schema is up yet.
 */
export function getDb(): Promise<DB> {
	if (!ready) {
		ready = migrate().catch((error) => {
			// Don't cache a failed init — let the next caller retry.
			ready = null;
			throw error;
		});
	}

	return ready;
}

/** Call on app start to warm the connection instead of paying for it on first query. */
export async function initDb(): Promise<void> {
	await getDb();
}

/**
 * `transliteration` is NOT NULL with a '' default on purpose: it keeps every read a
 * string, so nothing downstream has to handle a null.
 *
 * `word`, `transliteration` and `translation` hold what the user typed, case and all.
 * `search_text` holds the same three folded (lowercased, whitespace collapsed) in JS —
 * SQLite's own LIKE and lower() fold ASCII only, so leaving it to them would make
 * Cyrillic case-sensitive. That one column carries both jobs:
 *   - the three parts are newline-joined, which is what lets the prefix search anchor at
 *     the start of any one of them (see prefixPatterns in words.ts);
 *   - the UNIQUE index on it is the duplicate guard, so "Cat" cannot join "cat" even
 *     though the columns above no longer agree on case.
 *
 * words_unique, over the three raw columns, was that guard while they were stored
 * lowercased. It is dropped rather than kept: on a database written by an older build it
 * would now let a second casing of the same word in.
 */
async function migrate(): Promise<DB> {
	if (!db) db = open({ name: DB_NAME });

	// Must run outside a transaction, so not part of the batch below.
	await db.execute("PRAGMA journal_mode = WAL");

	await db.executeBatch([
		[
			`CREATE TABLE IF NOT EXISTS words (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				word TEXT NOT NULL,
				transliteration TEXT NOT NULL DEFAULT '',
				translation TEXT NOT NULL,
				search_text TEXT NOT NULL DEFAULT '',
				created_at INTEGER NOT NULL
			)`,
		],
		[`DROP INDEX IF EXISTS words_unique`],
		[`CREATE UNIQUE INDEX IF NOT EXISTS words_unique_text ON words (search_text)`],
		[`CREATE INDEX IF NOT EXISTS words_created_at ON words (created_at, id)`],
	]);

	return db;
}
