import SqliteDB, { type Database } from "better-sqlite3"
import { Config } from "../types.js"
import { dirname, join } from "node:path"
import { mkdirSync } from "node:fs"

export function setupDB(config: Config, path: string): Database {
	const fullPath = join(config.storage.path, path)
	const dir      = dirname(fullPath)

	try {
		mkdirSync(dir, { recursive: true })
	} catch (err) {
		console.error("Error creating directory:", err)
		process.exit(1)
	}

	const db = SqliteDB(fullPath, {})
	db.pragma('journal_mode = WAL')

	return db
}