import { type Database, Transaction } from "better-sqlite3"
import { type Author, type DictionaryEntry, type Room } from "./db_types.js"
import { type Message } from "./types.js"
import { dateToTimestamp } from "../util.js"

export function prepareStatements(db: Database) {
	const statements = {
		insertDictionaryEntry: db.prepare(`
			INSERT INTO dictionary (word)
			VALUES (@word) ON CONFLICT(word) DO NOTHING
		`),

		getDictionaryEntry: db.prepare(`
			SELECT * FROM dictionary WHERE word = @word
		`),

		getDictionaryEntryCount: db.prepare(`
			SELECT COUNT(*) as count FROM dictionary;
		`),

		insertAuthor: db.prepare(`
			INSERT INTO authors (author_name, author_domain, author_uid, is_bot)
			VALUES (@author_name, @author_domain, @author_uid, @is_bot) ON CONFLICT(author_name, author_domain) DO NOTHING
		`),

		getAuthor: db.prepare(`
			SELECT * FROM authors WHERE author_name = @author_name AND author_domain = @author_domain
		`),
		
		getAuthorByUid: db.prepare(`
			SELECT * FROM authors WHERE author_uid = @author_uid
		`),

		insertRoom: db.prepare(`
			INSERT INTO rooms (room_tag)
			VALUES (@room_tag) ON CONFLICT(room_tag) DO NOTHING
		`),

		getRoom: db.prepare(`
			SELECT * FROM rooms WHERE room_tag = @room_tag
		`),

		insertWord: db.prepare(`
			INSERT INTO words (word_idx, author_idx, room_idx, ts, count)
			VALUES (@word_idx, @author_idx, @room_idx, @ts, @count)
		`),

		getWords:   db.prepare(`
			SELECT * FROM words
			JOIN authors    ON words.author_idx = authors.author_idx
			JOIN rooms      ON words.room_idx   = rooms.room_idx
			JOIN dictionary ON words.word_idx   = dictionary.word_idx
			WHERE words.author_idx = @author_idx;
		`),

		getTotalWordCount: db.prepare(`
			SELECT SUM(count) as total_count FROM words;
		`),

		getTotalWordCountForUser: db.prepare(`
			SELECT SUM(count) as total_count FROM words
			JOIN authors ON words.author_idx = authors.author_idx
			WHERE author_name   = @author_name
			AND   author_domain = @author_domain;
		`),

		getToplist: db.prepare(`
			SELECT word, SUM(count) total_count FROM words
			JOIN dictionary ON words.word_idx   = dictionary.word_idx
			JOIN authors    ON words.author_idx = authors.author_idx
			WHERE is_bot = 0
			GROUP BY words.word_idx
			ORDER BY total_count DESC
			LIMIT @limit;	
		`),

		getToplistForUser: db.prepare(`
			SELECT word, SUM(count) total_count FROM words
			JOIN dictionary ON words.word_idx   = dictionary.word_idx
			JOIN authors    ON words.author_idx = authors.author_idx
			WHERE is_bot        = 0
			AND   author_name   = @author_name
			AND   author_domain = @author_domain
			GROUP BY words.word_idx
			ORDER BY total_count DESC
			LIMIT @limit;	
		`)
	} as const

	const authorMap = new Map<string, Set<string>>()

	const transactions = {
		insertMessage: db.transaction((message: Message) => {
			const { name: author_name, domain: author_domain, id: author_uid, is_bot } = message.author
			const { id: room_tag } = message.room
			const authorRowBefore = statements.getAuthorByUid!.get({ author_uid }) as Author | null

			if (!authorRowBefore) statements.insertAuthor!.run({ author_name, author_domain, author_uid, is_bot: Number(is_bot) })
			else {
				const entry = authorMap.get(author_uid) || new Set()

				if (entry.size > 0 && !entry.has(author_name)) {
					console.log("Duplicate UID detected:", `name: [${author_name}] id: ${author_uid}`)
				}

				entry.add(author_name)
				authorMap.set(author_uid, entry)
			}
			statements.insertRoom!.run({ room_tag })

			const authorRow  = statements.getAuthorByUid!.get({ author_uid }) as Author
			const roomRow    = statements.getRoom!.get({ room_tag })          as Room

			if (!authorRow) {
				console.log("no authorRow:", message)
			}

			for (const [word, count] of message.wordCounts.entries()) {
				statements.insertDictionaryEntry!.run({ word })
				const entry = statements.getDictionaryEntry!.get({ word }) as DictionaryEntry
				const ts = dateToTimestamp(message.ts)
				statements.insertWord!.run({
					word_idx:   entry.word_idx,
					author_idx: authorRow.author_idx,
					room_idx:   roomRow.room_idx,
					ts:         ts,
					count
				})
			}
		})
	} satisfies Record<string, Transaction>

	return {
		insertDictionaryEntry:   (entry:  { word: string }) => statements.insertDictionaryEntry.run(entry),
		getDictionaryEntry:      (filter: { word: string }) => statements.getDictionaryEntry.get(filter) as DictionaryEntry,
		getDictionaryEntryCount: () => {
			const result = statements.getDictionaryEntryCount.get() as { count: number }
			return result.count
		},

		insertAuthor:   (author: { author_name: string, author_domain: string, author_uid: string, is_bot: boolean }) => {
			return statements.insertAuthor.run({ ...author, is_bot: Number(author.is_bot) })
		},
		getAuthor:      (filter: { author_name: string, author_domain: string }) => {
			return statements.getAuthor.get(filter) as Author | null
		},
		getAuthorByUid: (filter: { author_uid: string }) => {
			return statements.getAuthorByUid.get(filter) as Author | null
		},

		insertRoom: (room:   { room_tag: string }) => statements.insertRoom.run(room),
		getRoom:    (filter: { room_tag: string }) => statements.getRoom.get(filter) as Room,

		insertWord: (wordcount: { word_idx: number, author_idx: number, room_idx: number, ts: number, count: number }) => {
			return statements.insertWord.run(wordcount)
		},
		getWords:   (author_idx: number) => statements.getWords.all({ author_idx }),
		getTotalWordCount: () => {
			const result = statements.getTotalWordCount.get() as { total_count: number }
			return result.total_count
		},
		getTotalWordCountForUser: (author_name: string, author_domain: string) => {
			const result = statements.getTotalWordCountForUser.get({ author_name, author_domain }) as { total_count: number }
			return result.total_count
		},

		getToplist: (limit: number) => statements.getToplist.all({ limit }) as ({ word: string, total_count: number })[],
		getToplistForUser: (filter: { author_name: string, author_domain: string }, limit: number) => {
			return statements.getToplistForUser.all({ ...filter, limit }) as ({ word: string, total_count: number })[]
		},


		insertMessage: (message: Message) => transactions.insertMessage(message)
	} satisfies Record<string, Function>
}