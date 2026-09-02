import { NewWord, Word } from "../db/words";

/** RFC 4180 asks for CRLF between records, and it is what Excel expects too. */
const ROW_SEPARATOR = "\r\n";

/**
 * Deliberately *not* run through i18n: a list exported with the UI in Russian has to
 * import back with the UI in English, so the header cannot move with the language.
 * Writing it out also lets the importer match columns by name instead of by position.
 */
export const CSV_COLUMNS = ["word", "transliteration", "translation"] as const;

/**
 * Excel reads a UTF-8 file as the local 8-bit codepage unless it opens with a BOM,
 * which turns every non-Latin word into mojibake. Import has to strip this back off.
 */
export const CSV_BOM = "\uFEFF";

/** RFC 4180: wrap only the fields that need it, and double any quote inside. */
function escapeField(value: string): string {
	return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serializes the whole dictionary, one word per row, in CSV_COLUMNS order. */
export function wordsToCsv(words: Word[]): string {
	const rows = words.map(word =>
		[word.word, word.transliteration, word.translation].map(escapeField).join(","),
	);

	return CSV_BOM + [CSV_COLUMNS.join(","), ...rows].join(ROW_SEPARATOR) + ROW_SEPARATOR;
}

/** Thrown when the picked file carries no header naming the columns we need. */
export class CsvFormatError extends Error {
	constructor() {
		super("The CSV has no word/translation header");
		this.name = "CsvFormatError";
	}
}

export type CsvImport = {
	words: NewWord[];
	/** Rows with no usable word/translation pair, so nothing could be taken from them. */
	invalid: number;
};

/**
 * Splits CSV text into records the RFC 4180 way, which is why this is a character scan
 * and not a `split`: inside quotes a comma, a line break and a doubled "" are all data.
 */
function parseRows(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let quoted = false;

	const endField = () => {
		row.push(field);
		field = "";
	};
	const endRow = () => {
		endField();
		rows.push(row);
		row = [];
	};

	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (quoted) {
			if (char !== '"') {
				field += char;
			} else if (text[i + 1] === '"') {
				// A doubled quote is one literal quote...
				field += '"';
				i++;
			} else {
				// ...a lone one closes the quoted run.
				quoted = false;
			}
			continue;
		}

		if (char === '"') {
			quoted = true;
		} else if (char === ",") {
			endField();
		} else if (char === "\n") {
			endRow();
		} else if (char === "\r") {
			// The CR of a CRLF is dropped and its LF ends the record; a lone CR ends it.
			if (text[i + 1] !== "\n") endRow();
		} else {
			field += char;
		}
	}

	// Only a record if the file did not end on a clean line break.
	if (field.length > 0 || row.length > 0) endRow();

	// A blank line parses as one empty field, which is not a record.
	return rows.filter(cells => cells.length > 1 || cells[0] !== "");
}

/**
 * Reads an exported dictionary back. Columns are matched by header *name*, so a file
 * whose columns were reordered still imports, and a missing transliteration is fine.
 *
 * Duplicates are deliberately left in: the UNIQUE index on
 * (word, transliteration, translation) is what skips them, which also catches words
 * repeated inside the file itself.
 */
export function csvToWords(text: string): CsvImport {
	const body = text.startsWith(CSV_BOM) ? text.slice(CSV_BOM.length) : text;
	const [header, ...rows] = parseRows(body);

	if (!header) throw new CsvFormatError();

	const columnAt = (name: string) =>
		header.findIndex(cell => cell.trim().toLowerCase() === name);

	const wordAt = columnAt("word");
	const translationAt = columnAt("translation");
	const transliterationAt = columnAt("transliteration");

	if (wordAt < 0 || translationAt < 0) throw new CsvFormatError();

	const words: NewWord[] = [];
	let invalid = 0;

	for (const cells of rows) {
		const word = (cells[wordAt] ?? "").trim();
		const translation = (cells[translationAt] ?? "").trim();

		// These two are what identify a word, so a row missing either is unusable.
		if (!word || !translation) {
			invalid++;
			continue;
		}

		words.push({
			word,
			translation,
			// Optional column; the schema stores '' when it is absent.
			transliteration:
				transliterationAt < 0 ? "" : (cells[transliterationAt] ?? "").trim(),
		});
	}

	return { words, invalid };
}
