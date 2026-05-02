import YSON from "@j0code/yson"
import type { Config } from "./types.js"
import { getAccessToken } from "./login.js"
import { AutojoinRoomsMixin, MatrixClient, RustSdkCryptoStorageProvider, SimpleFsStorageProvider } from "matrix-bot-sdk"

const config = (await YSON.load("./config.yson")) as unknown as Config
/*const accessToken = await getAccessToken(config)

const storageProvider = new SimpleFsStorageProvider(`${config.storage.path}/bot.json`)
const cryptoProvider  = new RustSdkCryptoStorageProvider(`${config.storage.path}/crypto`, 0)

const client = new MatrixClient(config.account.homeserver_url, accessToken, storageProvider, cryptoProvider)
AutojoinRoomsMixin.setupOnClient(client)

client.on("room.message", async (roomId: string, event: any) => {
	logMessage(roomId, event)
	if (!event['content']?.['msgtype']) return
	if (event['sender'] === await client.getUserId()) return

	await client.replyNotice(roomId, event, "Hello world!")
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
} */

import readline from "node:readline"
import { WordCount } from "./wordcount/wordcount.js"
import { parseUserId } from "./util.js"

const wordCount = new WordCount(config)
const dbReady = performance.now()
console.log(`DB ready after ${Math.floor(dbReady)/1000}s`)

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
}