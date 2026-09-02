import { getDb } from "./index";

export type Word = {
	id: number;
	word: string;
	transliteration: string;
	translation: string;
	createdAt: number;
};

export type NewWord = {
	word: string;
	transliteration: string | null;
	translation: string;
};

export type SortOrder = "new" | "old";

export type ListOptions = {
	sort?: SortOrder;
	search?: string;
	limit?: number;
	offset?: number;
};

const COLUMNS = "id, word, transliteration, translation, created_at AS createdAt";

type NormalizedWord = {
	word: string;
	transliteration: string;
	translation: string;
	searchText: string;
};

function normalize(input: NewWord): NormalizedWord {
	const word = input.word.trim().toLocaleLowerCase();
	const transliteration = (input.transliteration ?? "").trim().toLocaleLowerCase();
	const translation = input.translation.trim().toLocaleLowerCase();

	return {
		word,
		transliteration,
		translation,
		searchText: `${word}\n${transliteration}\n${translation}`.toLowerCase(),
	};
}

/** Escapes the LIKE wildcards so a user searching for "%" finds a literal "%". */
function likePattern(term: string): string {
	return `%${term.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;
}

const INSERT_WORD = `INSERT OR IGNORE INTO words
	(word, transliteration, translation, search_text, created_at)
	VALUES (?, ?, ?, ?, ?)`;

/**
 * Adds one word. Returns inserted: false when the exact triple is already stored —
 * the UNIQUE index decides, so no read-then-write race.
 */
export async function addWord(input: NewWord): Promise<{ inserted: boolean; id?: number }> {
	const value = normalize(input);
	const db = await getDb();
	const result = await db.execute(INSERT_WORD, [
		value.word,
		value.transliteration,
		value.translation,
		value.searchText,
		Date.now(),
	]);

	return { inserted: result.rowsAffected > 0, id: result.insertId };
}

/** Bulk insert for CSV import. Duplicates are skipped; returns how many rows landed. */
export async function addWords(inputs: NewWord[]): Promise<{ inserted: number; skipped: number }> {
	if (inputs.length === 0) return { inserted: 0, skipped: 0 };

	const now = Date.now();
	const params = inputs.map((input) => {
		const value = normalize(input);
		return [value.word, value.transliteration, value.translation, value.searchText, now];
	});

	const db = await getDb();
	const result = await db.executeBatch([[INSERT_WORD, params]]);
	const inserted = result.rowsAffected ?? 0;

	return { inserted, skipped: inputs.length - inserted };
}

/** One page of words, newest first by default. Pass search to filter across all three fields. */
export async function listWords(options: ListOptions = {}): Promise<Word[]> {
	const { sort = "old", search = "", limit = 50, offset = 0 } = options;
	const direction = sort === "old" ? "ASC" : "DESC";
	const term = search.trim();

	const where = term ? "WHERE search_text LIKE ? ESCAPE '\\'" : "";
	const params = term ? [likePattern(term), limit, offset] : [limit, offset];

	const db = await getDb();
	const { rows } = await db.execute(
		`SELECT ${COLUMNS} FROM words ${where}
			ORDER BY created_at ${direction}, id ${direction}
			LIMIT ? OFFSET ?`,
		params,
	);

	return rows as Word[];
}

export async function countWords(search = ""): Promise<number> {
	const term = search.trim();
	const where = term ? "WHERE search_text LIKE ? ESCAPE '\\'" : "";
	const params = term ? [likePattern(term)] : [];

	const db = await getDb();
	const { rows } = await db.execute(`SELECT COUNT(*) AS total FROM words ${where}`, params);

	return (rows[0]?.total as number) ?? 0;
}

/** Every word, oldest first — for CSV export. */
export async function allWords(): Promise<Word[]> {
	const db = await getDb();
	const { rows } = await db.execute(
		`SELECT ${COLUMNS} FROM words ORDER BY created_at ASC, id ASC`,
	);

	return rows as Word[];
}

export async function deleteWord(id: number): Promise<void> {
	const db = await getDb();
	await db.execute("DELETE FROM words WHERE id = ?", [id]);
}
