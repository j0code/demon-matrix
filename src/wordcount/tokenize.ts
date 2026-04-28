export function tokenize(text: string): string[] {
	/* Normalize
		- Convert to lowercase
		- German characters: ä→ae, ö→oe, ü→ue, ß→ss
		- Unicode decomposition (e.g., é → e + ́ )
		- Remove combining diacritical marks (accents)
		- Unicode recomposition (NFC) to ensure characters are in a consistent form
	*/
	let normalized = text
		.toLowerCase()
		.replace(/ä/g, "ae")
		.replace(/ö/g, "oe")
		.replace(/ü/g, "ue")
		.replace(/ß/g, "ss")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.normalize("NFC")

	/**
	 * Pattern to tokenize text into words.
	 * 
	 * Matches (in order):
	 * 1. [0-9#*]\uFE0F\u{20E3}
	 *    Keycap sequences (digit or symbol + variation selector + keycap mark)
	 *    e.g., 1️⃣, 2️⃣, #️⃣, *️⃣
	 * 
	 * 2. [a-zA-Z0-9']+
	 *    Sequences of ASCII letters, digits, and apostrophes
	 *    e.g., "hello", "s0m30n3", "what's"
	 * 
	 * 3. [\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]
	 *    Individual CJK characters (not grouped into words)
	 *    Chinese (Han), Japanese (Hiragana/Katakana), Korean (Hangul)
	 *    e.g., "你好" → "你", "好"
	 * 
	 * 4. \p{L}+
	 *    Sequences of non-ASCII, non-CJK Unicode letters
	 *    e.g., Arabic "مرحبا", Cyrillic "привет"
	 * 
	 * 5. \p{Regional_Indicator}{2}
	 *    Regional indicator pairs (flag emoji)
	 *    e.g., 🇩🇪, 🇺🇸, 🇯🇵
	 * 
	 * 6. Non-ASCII emoji with optional modifiers
	 *    Matches emoji followed by any combination of:
	 *    - Variation selectors (\uFE0F)
	 *    - Skin tone modifiers ([\u{1F3FB}-\u{1F3FF}])
	 *    - Combining marks (\p{Mark})
	 *    - Zero-width joiner sequences (\u{200D} + emoji)
	 *    This handles complex emoji like:
	 *    - 👍🏽 (emoji with skin tone)
	 *    - 👨‍💻 (emoji with ZWJ)
	 *    - 🏳️‍🌈 (multi-part emoji)
	 *    - 👩‍👩‍👧‍👦 (family emoji)
	 */
	const pattern =
		/[0-9#*]\uFE0F\u{20E3}|[a-zA-Z0-9']+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|\p{L}+|\p{Regional_Indicator}{2}|(?![\x00-\x7F])\p{Emoji}(?:[\uFE0F\u{1F3FB}-\u{1F3FF}]|\p{Mark}|\u{200D}(?![\x00-\x7F])\p{Emoji})*/gu

	return normalized
		.match(pattern)
		?.map(word => {
			if (word.startsWith("'")) word = word.slice(1)
			if (word.endsWith("'"))   word = word.slice(0, word.length - 1)
			return word
		})
		.filter(word => word.replaceAll("'", "").length != 0) || []
}