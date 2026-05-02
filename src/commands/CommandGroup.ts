import { MatrixClient } from "matrix-bot-sdk"
import Command from "./Command.js"
import { ParsedUser } from "../types.js"

export default class CommandGroup extends Command {

	private commands: Map<string, Command>
	
	constructor(description: string) {
		super(description)
		this.commands = new Map()
	}

	registerCommand(cmdname: string, command: Command) {
		this.commands.set(cmdname, command)
	}

	run(client: MatrixClient, allArgs: string[], room: string, sender: ParsedUser, cmdname: string) {
		const subcmdname  = allArgs[0] ?? ""
		const fullcmdname = `${cmdname} ${subcmdname}`
		const args        = allArgs.slice(1)
		const command     = this.commands.get(subcmdname)

		if (!command) {
			client.sendNotice(room, `⨯ Unknown command '${cmdname} ${subcmdname}'`)
			return
		}

		command.run(client, args, room, sender, `${cmdname} ${subcmdname}`)
	}

	syntax(cmdname: string) {
		const list: string[] = []

		for (const subcmdname of this.commands.keys()) {
			const command     = this.commands.get(subcmdname)!
			const fullcmdname = `${cmdname} ${subcmdname}`

			list.push(command.syntax(fullcmdname))
		}

		return list.join("\n")
	}

	listCommands(cmdname: string) {
		const list: string[][] = []

		for (const subcmdname of this.commands.keys()) {
			const command     = this.commands.get(subcmdname)!
			const fullcmdname = `${cmdname} ${subcmdname}`

			if (command instanceof CommandGroup) {
				list.push(...command.listCommands(fullcmdname))
			} else {
				list.push([fullcmdname, command.description])
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