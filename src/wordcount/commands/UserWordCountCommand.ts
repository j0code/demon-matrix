import { MatrixClient } from "matrix-bot-sdk"
import Command from "../../commands/Command.js"
import { WordCount } from "../WordCount.js"
import { codeblockTable } from "../../util.js"

export default class UserWordCountCommand extends Command {

	constructor(private wordCount: WordCount) {
		super("top list for user")
	}

	run(client: MatrixClient, args: string[], room: string) {
		const tag = args[0]
		const limit = parseInt(args[1] ?? "10")
		if (!tag) {
			console.log("no user tag provided")
			return console.groupEnd()
		}
		if (isNaN(limit) || limit < 1 || limit > 40) {
			client.sendNotice(room, `⨯ Invalid limit`)
			return
		}

		const result = this.wordCount.getToplistForUser(tag, limit)
		const toplist = [
			["place", "word", "count"],
			...result.toplist.map((entry, i) => [`#${i+1}`, entry.word, entry.total_count])
		]

		const lines = []
		lines.push(`<h1>TOP ${limit} WORDS</h1>`)
		lines.push(`User: ${tag}<br>`)
		lines.push(`Total words: ${result.wordCount}`)
		lines.push(codeblockTable(toplist))

		const output = lines.join("\n")
		
		client.sendHtmlText(room, output)
	}

	syntax(cmdname: string) {
		return `${cmdname} <user-tag> [<limit>]`
	}

}