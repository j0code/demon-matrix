import YSON from "@j0code/yson"
import type { Config } from "./types.js"
import { getAccessToken } from "./login.js"
import { AutojoinRoomsMixin, MatrixClient, RustSdkCryptoStorageProvider, SimpleFsStorageProvider } from "matrix-bot-sdk"
import { WordCount } from "./wordcount/WordCount.js"
import CommandRegistry from "./commands/CommandRegistry.js"
import HelpCommand from "./commands/HelpCommand.js"
import { parseUserId } from "./util.js"

const config = (await YSON.load("./config.yson")) as unknown as Config
const accessToken = await getAccessToken(config)

const storageProvider = new SimpleFsStorageProvider(`${config.storage.path}/bot.json`)
const cryptoProvider  = new RustSdkCryptoStorageProvider(`${config.storage.path}/crypto`, 0)

const commandRegistry = new CommandRegistry
const wordCount = new WordCount(config, commandRegistry)
const dbReady = performance.now()
console.log(`DB ready after ${Math.floor(dbReady)/1000}s`)

commandRegistry.registerCommand("help", new HelpCommand(commandRegistry))

const client = new MatrixClient(config.account.homeserver_url, accessToken, storageProvider, cryptoProvider)
AutojoinRoomsMixin.setupOnClient(client)

client.on("room.message", async (roomId: string, event: unknown) => {
	logMessage(roomId, event)

	if (!event || typeof event != "object" || event == null) return
	if (!("sender"  in event) || typeof event.sender  != "string") return
	if (!("content" in event) || typeof event.content != "object" || event.content == null) return
	if (!("origin_server_ts" in event) || typeof event.origin_server_ts != "number") return
	const senderTag = event.sender
	const sender    = parseUserId(senderTag)
	const content   = event.content
	const ts        = Temporal.Instant.fromEpochMilliseconds(event.origin_server_ts).toString()

	if (event.sender == await client.getUserId()) return

	if (!("msgtype" in content) || typeof event.sender  != "string") return
	if (!("body"    in content)) return
	const msgtype = content.msgtype
	const body    = content.body

	if (msgtype == "m.text" && typeof body == "string") {
		if (body.startsWith("!")) {
			commandRegistry.dispatchCommand(client, roomId, sender, body.slice(1))
		} else {
			wordCount.addMessage(body, sender, roomId, ts)
		}
	}


})

client.start().then(() => console.log("Bot started!"))

async function logMessage(roomId: string, event: any) {
	const content = event?.content
	const msgtype = content?.msgtype
	const body = content?.body
	const sender = event?.sender

	const roomNameEvent = await client.getRoomStateEvent(roomId, "m.room.name", "").catch(() => null)
	const roomName = roomNameEvent?.name || roomId
	console.log(`${msgtype} #${roomName} ${sender}: ${body}`)
}

/*import readline from "node:readline"
import { parseUserId } from "./util.js"

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

rl.on("line", (input: string) => {
	const [cmd, ...args] = input.split(" ")
	if (!cmd) return

	console.group("< " + input)

	if (cmd == "count") {
		const limit = parseInt(args[0] ?? "10")
		if (isNaN(limit) || limit < 1 || limit > 40) {
			console.log("invalid limit")
			return console.groupEnd()
		}

		const { result, elapsed } = perf(() => wordCount.getToplist(limit))
		console.log(result)
		logPerf(elapsed)
		return console.groupEnd()
	}

	if (cmd == "usercount") {
		const tag = args[0]
		const limit = parseInt(args[1] ?? "10")
		if (!tag) {
			console.log("no user tag provided")
			return console.groupEnd()
		}
		if (isNaN(limit) || limit < 1 || limit > 40) {
			console.log("invalid limit")
			return console.groupEnd()
		}

		const { result, elapsed } = perf(() => wordCount.getToplistForUser(tag, limit))
		console.log(result)
		logPerf(elapsed)
		return console.groupEnd()
	}

	if (cmd == "export") {
		const tag = args[0]
		if (!tag) {
			console.log("no user tag provided")
			return console.groupEnd()
		}

		const { result, elapsed } = perf(() => wordCount.exportUserData(tag))
		console.log(`AUTHOR.csv`)
		console.log(result.author)
		console.log(`WORDS.csv`)
		console.log(result.words)
		logPerf(elapsed)
		return console.groupEnd()
	}

	console.log(`unknown command '${cmd}'`)
	console.groupEnd()
})

rl.on("close", () => {
	process.exit(0)
})

function perf<T>(fn: () => T) {
	const before = performance.now()
	const result = fn()

	return { result, elapsed: Math.floor(performance.now() - before) / 1000 }
}

function logPerf(elapsed: number) {
	console.log(`🕒 query took ${elapsed}s`)
}*/