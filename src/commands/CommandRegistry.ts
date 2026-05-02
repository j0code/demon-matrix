import { MatrixClient } from "matrix-bot-sdk"
import Command from "./Command.js"
import CommandGroup from "./CommandGroup.js"
import { ParsedUser } from "../types.js"

export default class CommandRegistry {

	private commands: Map<string, Command>

	constructor() {
		this.commands = new Map()
	}

	registerCommand(cmdname: string, command: Command) {
		this.commands.set(cmdname, command)
	}

	dispatchCommand(client: MatrixClient, room: string, sender: ParsedUser, message: string) {
		const [cmdname, ...args] = message.split(" ") as [string, ...string[]]
		const command = this.commands.get(cmdname)

		if (!command) {
			client.sendNotice(room, `⨯ Unknown command '${cmdname}'`)
			return
		}

		command.run(client, args, room, sender, cmdname)
	}

	listCommands() {
		const list: string[][] = []

		for (const cmdname of this.commands.keys()) {
			const command = this.commands.get(cmdname)!
			if (command instanceof CommandGroup) {
				list.push([cmdname, command.description])
				list.push(...command.listCommands(cmdname))
			} else {
				list.push([cmdname, command.description])
			}
		}

		return list
	}

	getCommand(allArgs: string[]): Command | undefined {
		const subcmdname = allArgs[0] ?? ""
		const args       = allArgs.slice(1)
		const command    = this.commands.get(subcmdname)

		if (command instanceof CommandGroup && args.length > 0) {
			return command.getCommand(args)
		}
		return command
	}


}