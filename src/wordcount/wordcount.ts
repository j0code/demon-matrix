import { Statement, Transaction, type Database } from "better-sqlite3"
import { Config } from "../types.js"
import { setupDB } from "../db/Database.js"
import fs from "node:fs/promises"
import { tokenize } from "./tokenize.js"
import { prepareStatements } from "./statements.js"
import { parseUserId } from "../util.js"
import { type Message, type MessageParsed } from "./types.js"

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
		const { name: author_name, domain: author_domain  } = parseUserId(user_tag)
		const list = this.queries.getToplistForUser({ author_name, author_domain }, limit)

		let text = `TOP ${limit} FOR USER ${user_tag}\n`
		text += "word count\n"
		text += list.map(entry => `${entry.word} ${entry.total_count}`).join("\n")

		return text
	}

}