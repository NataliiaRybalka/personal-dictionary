import { Word } from "../db/words";

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
