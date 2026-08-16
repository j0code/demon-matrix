import { type Database } from "better-sqlite3"
import { Config, ParsedUser } from "../types.js"
import { setupDB } from "../db/Database.js"
import fs from "node:fs/promises"
import { tokenize } from "./tokenize.js"
import { prepareStatements } from "./statements.js"
import { parseUserId, timestampToDate } from "../util.js"
import { type Message } from "./types.js"
import { stringify as csvStringify } from "csv-stringify/sync"
import CommandRegistry from "../commands/CommandRegistry.js"
import WordCountCommand from "./commands/WordCountCommand.js"
import UserWordCountCommand from "./commands/UserWordCountCommand.js"
import CommandGroup from "../commands/CommandGroup.js"
import WordCountDataExportCommand from "./commands/WordCountDataExportCommand.js"

const setupPath = "./sql/wordcount_setup.sql"
const setupSQL  = await fs.readFile(setupPath, "utf-8")

export class WordCount {
	private db: Database
	private queries: ReturnType<typeof prepareStatements>
	private authorMap:  Record<string, string>

	constructor(config: Config, commandRegistry: CommandRegistry, authorMap: Record<string, string> = {}) {
		this.db = setupDB(config, "wordcount/wordcount.db")
		this.db.exec(setupSQL)
		this.queries = prepareStatements(this.db)
		this.authorMap = authorMap

		const wordCountCommand = new CommandGroup("word counts")
		wordCountCommand.registerCommand("top",    new WordCountCommand(this))
		wordCountCommand.registerCommand("user",   new UserWordCountCommand(this))
		wordCountCommand.registerCommand("export", new WordCountDataExportCommand(this))
		commandRegistry.registerCommand("wordcount", wordCountCommand)
	}

	public addMessage(text: string, author: ParsedUser, room_tag: string, ts: string) {
		const words  = tokenize(text)
		const counts = new Map<string, number>()
		let author_name = author.name

		if (author.id in this.authorMap) {
			author_name = this.authorMap[author.id]!
		}

		for (const word of words) {
			counts.set(word, (counts.get(word) || 0) + 1)
		}

		// console.log("got message", text)
		// console.log("tokenized to", words)
		// console.log("author:", author)

		this.queries.insertMessage!({
			text,
			wordCounts: counts,
			author: {
				...author,
				name: author_name
			},
			room: {
				id: room_tag
			},
			ts: ts
		} satisfies Message)
	}

	public getToplist(limit: number = 10) {
		const wordCount = this.queries.getTotalWordCount()
		const uniqueWordCount = this.queries.getDictionaryEntryCount()
		const toplist = this.queries.getToplist(limit)
		return { toplist, wordCount, uniqueWordCount }
	}

	public getToplistForUser(user_tag: string, limit: number = 0) {
		const { name: author_name, domain: author_domain } = parseUserId(user_tag)
		const wordCount = this.queries.getTotalWordCountForUser(author_name, author_domain)
		const toplist = this.queries.getToplistForUser({ author_name, author_domain }, limit)

		return { toplist, wordCount }
	}

	public exportUserData(user: ParsedUser, format: "csv" | "yson" | "yson-pretty" = "csv"): { author: string, words: string } | null {
		const { name: author_name, domain: author_domain } = user
		const author = this.queries.getAuthor({ author_name, author_domain })

		if (!author) {
			return null
		}

		const words  = this.queries.getWords(author.author_idx) as any[]
		const authorData = {
			name:   author.author_name,
			domain: author.author_domain,
			uid:    author.author_uid,
			is_bot: author.is_bot
		}
		const wordsData: any[] = []

		for (const word of words) {
			wordsData.push({
				word:      word.word,
				count:     word.count,
				language:  word.language,
				room:      word.room_tag,
				timestamp: timestampToDate(word.ts)
			})
		}
		

		if (format == "csv") {
			const authorCsv = csvStringify([authorData], {
				header: true
			})
			const wordsCsv  = csvStringify(wordsData, {
				header: true
			})

			return { author: authorCsv, words: wordsCsv }
		}

		return { author: "", words: "" }
	}

}