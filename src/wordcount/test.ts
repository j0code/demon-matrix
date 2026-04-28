import { tokenize } from "./tokenize.js"

function compareArrays(arr1: string[], arr2: string[]): boolean {
	if (arr1.length !== arr2.length) return false
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false
	}
	return true
}

function stringifyArray(arr: string[]): string {
	if (arr.length == 0) return "(empty)"
	return arr.map(s => `${s.length}[${s}]`).join(" ")
}

const tests = [
	{ text: "Hello, world! 👋🌍", words: ["hello", "world", "👋", "🌍"] },
	{ text: "Das ist ein Test. Äpfel, Öl, Über, Straße.", words: ["das", "ist", "ein", "test", "aepfel", "oel", "ueber", "strasse"] },
	{ text: "Emoji test: 😀👍🏽👩‍💻", words: ["emoji", "test", "😀", "👍🏽", "👩‍💻"] },
	{ text: "Mixed: Hello 👋, wie geht's? 🇩🇪", words: ["mixed", "hello", "👋", "wie", "geht's", "🇩🇪"] },
	{ text: "Accents: café, naïve, façade.", words: ["accents", "cafe", "naive", "facade"] },
	{ text: "hello world!", words: ["hello", "world"] },
	{ text: "https://www.example.com/some-article?ab=0", words: ["https", "www", "example", "com", "some", "article", "ab", "0"] },
	{ text: "s0m30n3 said what's up?", words: ["s0m30n3", "said", "what's", "up"] },
	{ text: "Flags: 🇺🇸🇩🇪🇯🇵", words: ["flags", "🇺🇸", "🇩🇪", "🇯🇵"] },
	{ text: "Complex emoji: 👩‍👩‍👧‍👦", words: ["complex", "emoji", "👩‍👩‍👧‍👦"] },
	{ text: "Mixed languages: Hello 你好 مرحبا", words: ["mixed", "languages", "hello", "你", "好", "مرحبا"] },
	{ text: "✨ magic ✨", words: ["✨", "magic", "✨"] },
	{ text: "🏳️‍🌈🌈🇩🇪", words: ["🏳️‍🌈", "🌈", "🇩🇪"] },
	{ text: "!\"§$%&/()=?´{[]}\\`*+~#-_.:,;|<>^°", words: [] },
	// Complex emoji sequences
	{ text: "Family: 👨‍👩‍👧‍👦👨‍👩‍👧👨‍👩‍👦", words: ["family", "👨‍👩‍👧‍👦", "👨‍👩‍👧", "👨‍👩‍👦"] },
	{ text: "Skin tones: 👋🏻👋🏼👋🏽👋🏾👋🏿", words: ["skin", "tones", "👋🏻", "👋🏼", "👋🏽", "👋🏾", "👋🏿"] },
	{ text: "Professionals: 👨🏻‍⚕️👩🏿‍🔬👨🏽‍🎓", words: ["professionals", "👨🏻‍⚕️", "👩🏿‍🔬", "👨🏽‍🎓"] },
	{ text: "Hands: 🤝👏🙌👐🤲", words: ["hands", "🤝", "👏", "🙌", "👐", "🤲"] },
	{ text: "Keycaps: 1️⃣2️⃣3️⃣*️⃣", words: ["keycaps", "1️⃣", "2️⃣", "3️⃣", "*️⃣"] },
	{ text: "Hearts: ❤️🧡💛💚", words: ["hearts", "❤️", "🧡", "💛", "💚"] },
	{ text: "Multi-skin tones: 🧑🏻‍🐰‍🧑🏿👨🏼‍🫯‍👨🏻", words: ["multi", "skin", "tones", "🧑🏻‍🐰‍🧑🏿", "👨🏼‍🫯‍👨🏻"] },
	{ text: "Apostrophe rules: don't mustn't've 'hello' ' '' ''' 'can't' 's it's", words: ["apostrophe", "rules", "don't", "mustn't've", "hello", "can't", "s", "it's"] }
]

for (const { text, words } of tests) {
	const result = tokenize(text)
	const passed = compareArrays(result, words)
	
	if (passed) {
		console.log("✔", text, "→", stringifyArray(result))
	} else {
		console.log("✘", text)
		console.log("  Expected:", stringifyArray(words))
		console.log("  Got:     ", stringifyArray(result))
	}
}