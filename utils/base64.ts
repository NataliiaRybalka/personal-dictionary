// Repacking bytes into 6-bit groups *is* the base64 algorithm, so the shifts and masks
// below are the point rather than a shortcut.
/* eslint-disable no-bitwise */

/**
 * UTF-8 -> base64. React Native 0.87 ships neither `btoa` nor `TextEncoder`, so both
 * halves are done by hand. `btoa` would not have been enough anyway: it throws on
 * anything above U+00FF, and the dictionary is mostly non-Latin words.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * `encodeURIComponent` already emits well-formed UTF-8 as %XX escapes, surrogate pairs
 * included — that is the part which is easy to get wrong writing the encoder by hand.
 * Everything it leaves unescaped is ASCII, so for those charCodeAt *is* the byte.
 *
 * It throws URIError on a lone surrogate; that is left to the caller, since failing the
 * export loudly beats writing a file with a corrupted character in it.
 */
function utf8Bytes(text: string): number[] {
	const encoded = encodeURIComponent(text);
	const bytes: number[] = [];

	for (let i = 0; i < encoded.length; i++) {
		if (encoded[i] === "%") {
			bytes.push(parseInt(encoded.slice(i + 1, i + 3), 16));
			i += 2;
		} else {
			bytes.push(encoded.charCodeAt(i));
		}
	}

	return bytes;
}

export function utf8ToBase64(text: string): string {
	const bytes = utf8Bytes(text);
	let out = "";

	// Every three bytes carry exactly four base64 characters; a short tail is padded.
	for (let i = 0; i < bytes.length; i += 3) {
		const chunk = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
		const remaining = bytes.length - i;

		out += ALPHABET[(chunk >> 18) & 63];
		out += ALPHABET[(chunk >> 12) & 63];
		out += remaining > 1 ? ALPHABET[(chunk >> 6) & 63] : "=";
		out += remaining > 2 ? ALPHABET[chunk & 63] : "=";
	}

	return out;
}
