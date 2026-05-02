import { MatrixClient } from "matrix-bot-sdk"
import Command from "../../commands/Command.js"
import { WordCount } from "../WordCount.js"
import { codeblockTable } from "../../util.js"

export default class WordCountCommand extends Command {

	constructor(private wordCount: WordCount) {
		super("top list")
	}

	run(client: MatrixClient, args: string[], room: string) {
		const limit = parseInt(args[0] ?? "10")
		if (isNaN(limit) || limit < 1 || limit > 40) {
			client.sendNotice(room, `⨯ Invalid limit`)
			return
		}

		const result = this.wordCount.getToplist(limit)
		const toplist = [
			["place", "word", "count"],
			...result.toplist.map((entry, i) => [`#${i+1}`, entry.word, entry.total_count])
		]

		const lines = []
		lines.push(`<h1>TOP ${limit} WORDS</h1>`)
		lines.push(`Total words: ${result.wordCount}<br>`)
		lines.push(`Total unique words: ${result.uniqueWordCount}`)
		lines.push(codeblockTable(toplist))

		const output = lines.join("\n")
		
		client.sendHtmlText(room, output)
	}

	syntax(cmdname: string) {
		return `${cmdname} [<limit>]`
	}

}