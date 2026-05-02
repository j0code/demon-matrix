import { type Database } from "better-sqlite3"
import { Config } from "../types.js"
import { setupDB } from "../db/Database.js"
import fs from "node:fs/promises"
import { tokenize } from "./tokenize.js"
import { prepareStatements } from "./statements.js"
import { parseUserId, timestampToDate } from "../util.js"
import { type Message, type MessageParsed } from "./types.js"
import { stringify as csvStringify } from "csv-stringify/sync"

const setupPath = "./sql/wordcount_setup.sql"
const setupSQL  = await fs.readFile(setupPath, "utf-8")

export class WordCount {
	private db: Database
	private queries: ReturnType<typeof prepareStatements>
	private authorMap:  Record<string, string>

	constructor(config: Config, authorMap: Record<string, string> = {}) {
		this.db = setupDB(config, "wordcount/wordcount.db")
		this.db.exec(setupSQL)
		this.queries = prepareStatements(this.db)
		this.authorMap    = authorMap
	}

	public addMessage(message: Message) {
		const words  = tokenize(message.text)
		const counts = new Map<string, number>()
		const rawAuthor = message.author
		const rawRoom   = message.room
		let { name: author_name, domain: author_domain } = parseUserId(rawAuthor.author_tag)

		if (rawAuthor.author_uid in this.authorMap) {
			author_name = this.authorMap[rawAuthor.author_uid]!
		}

		for (const word of words) {
			counts.set(word, (counts.get(word) || 0) + 1)
		}

		this.queries.insertMessage!({
			text: message.text,
			wordCounts: counts,
			author: {
				...rawAuthor,
				author_name,
				author_domain
			},
			room: {
				...rawRoom
			},
			ts: message.ts
		} satisfies MessageParsed)
	}

	public getToplist(limit: number = 10) {
		const list = this.queries.getToplist(limit)

		let text = `TOP ${limit}\n`
		text += "word count\n"
		text += list.map(entry => `${entry.word} ${entry.total_count}`).join("\n")

		return text
	}

	public getToplistForUser(user_tag: string, limit: number = 0) {
		const { name: author_name, domain: author_domain } = parseUserId(user_tag)
		const list = this.queries.getToplistForUser({ author_name, author_domain }, limit)

		let text = `TOP ${limit} FOR USER ${user_tag}\n`
		text += "word count\n"
		text += list.map(entry => `${entry.word} ${entry.total_count}`).join("\n")

		return text
	}

	public exportUserData(user_tag: string, format: "csv" | "yson" | "yson-pretty" = "csv") {
		const { name: author_name, domain: author_domain } = parseUserId(user_tag)
		const author = this.queries.getAuthor({ author_name, author_domain })
		const words  = this.queries.getWords(author.author_idx) as any[]
		const authorData = {
			name: author.author_name,
			domain: author.author_domain,
			uid: author.author_uid,
			is_bot: author.is_bot
		}
		const wordsData: any[] = []

		for (const word of words) {
			wordsData.push({
				word: word.word,
				count: word.count,
				language: word.language,
				room: word.room_tag,
				timestamp: timestampToDate(word.ts)
			})
		}
		

		if (format == "csv") {
			const authorCsv = csvStringify([authorData], {
				header: true
			})
			const wordsCsv  = csvStringify(wordsData.slice(0, 10), {
				header: true
			})

			return { author: authorCsv, words: wordsCsv }
		}

		return { author: "" }
	}

}