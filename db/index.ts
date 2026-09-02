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
 * `transliteration` is NOT NULL with a '' default on purpose: SQLite treats NULLs as
 * distinct inside a UNIQUE index, so a nullable column would let duplicates through
 * the dedup guard whenever the transliteration is empty.
 *
 * `search_text` holds word + transliteration + translation lowercased in JS. SQLite's
 * own LIKE and lower() only fold ASCII case, so searching Cyrillic through them would
 * be case-sensitive.
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
		[
			`CREATE UNIQUE INDEX IF NOT EXISTS words_unique
				ON words (word, transliteration, translation)`,
		],
		[`CREATE INDEX IF NOT EXISTS words_created_at ON words (created_at, id)`],
	]);

	return db;
}
