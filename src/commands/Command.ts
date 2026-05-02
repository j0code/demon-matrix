import { MatrixClient } from "matrix-bot-sdk";
import { ParsedUser } from "../types.js";

export default abstract class Command {

	description: string

	constructor(description: string) {
		this.description = description
	}

	abstract run(client: MatrixClient, args: string[], room: string, sender: ParsedUser, cmdname: string): void

	abstract syntax(cmdname: string): string

}