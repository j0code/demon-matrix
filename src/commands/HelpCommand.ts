import { MatrixClient } from "matrix-bot-sdk"
import Command from "./Command.js"
import CommandRegistry from "./CommandRegistry.js"
import { codeblock, codeblockTable } from "../util.js"
import { ParsedUser } from "../types.js"

export default class HelpCommand extends Command {

	constructor(private registry: CommandRegistry) {
		super("help command")
	}

	run(client: MatrixClient, args: string[], room: string, sender: ParsedUser) {
		if (args.length == 0) {
			commandList(client, room, this.registry)
			return
		}

		commandHelp(client, room, this.registry, args)
	}

	syntax(cmdname: string) {
		return `${cmdname} [<command>]`
	}

}

function commandList(client: MatrixClient, room: string, registry: CommandRegistry) {
	const list  = registry.listCommands()
	const table = codeblockTable(list, "  ")

	const lines: string[] = []
	lines.push(`<h1>Command List</h1>`)
	lines.push(table)
	lines.push("For more info, try <code>!help &lt;command&gt;</code>")

	client.sendHtmlText(room, lines.join("\n"))
}

function commandHelp(client: MatrixClient, room: string, registry: CommandRegistry, args: string[]) {
	const command = registry.getCommand(args)

	if (!command) {
		client.sendNotice(room, `⨯ Unknown command '${args.join(" ")}'`)
		return
	}

	const syntax = command.syntax(args.join(" "))

	const lines: string[] = []
	lines.push(`<h1>Command Help</h1>`)
	lines.push(`Command: ${args.join(" ")}<br>`)
	lines.push(`Description: ${command.description}<br>`)
	lines.push(`Syntax: ${codeblock(syntax)}`)

	client.sendHtmlText(room, lines.join("\n"))
}