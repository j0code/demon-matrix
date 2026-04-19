import YSON from "@j0code/yson"
import type { Config } from "./types.js"
import { getAccessToken } from "./login.js"
import { AutojoinRoomsMixin, MatrixClient, RustSdkCryptoStorageProvider, SimpleFsStorageProvider } from "matrix-bot-sdk"

const config = (await YSON.load("./config.yson")) as unknown as Config
const accessToken = await getAccessToken(config)

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
}