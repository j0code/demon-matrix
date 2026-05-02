import { MatrixClient } from "matrix-bot-sdk"
import Command from "../../commands/Command.js"
import { WordCount } from "../WordCount.js"
import { ParsedUser } from "../../types.js"
import { sendFile } from "../../util.js"

export default class WordCountDataExportCommand extends Command {

	constructor(private wordCount: WordCount) {
		super("export user data")
	}

	async run(client: MatrixClient, args: string[], room: string, sender: ParsedUser) {
		// TODO: remove domain override
		const data = this.wordCount.exportUserData({ name: sender.name, domain: "discord.com", tag: `@${sender.name}:discord.com` })

		if (!data) {
			client.sendText(room, `No data found for ${sender.tag}`)
			return
		}

		const authorBuffer = Buffer.from(data.author, "utf-8")
		const wordsBuffer  = Buffer.from(data.words,  "utf-8")

		const authorUrl = await client.uploadContent(authorBuffer, "application/csv")
		const wordsUrl  = await client.uploadContent(wordsBuffer,  "application/csv")

		sendFile(client, room, {
			filename: "author.csv",
			size: authorBuffer.byteLength,
			mimetype: "application/csv",
			url: authorUrl,
			caption: "Word Count Author Data Export"
		})

		sendFile(client, room, {
			filename: "words.csv",
			size: wordsBuffer.byteLength,
			mimetype: "application/csv",
			url: wordsUrl,
			caption: "Word Count Words Data Export"
		})
	}

	syntax(cmdname: string) {
		return cmdname
	}

}