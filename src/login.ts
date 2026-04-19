import { MatrixAuth } from "matrix-bot-sdk"
import type { Config } from "./types.js"
import fs from "fs/promises"

export async function getAccessToken(config: Config): Promise<string> {
	const tokenPath = `${config.storage.path}/access_token.txt`

	const stat = await fs.stat(tokenPath).catch(() => null)
	if (stat?.isFile()) {
		const token = await fs.readFile(tokenPath, "utf-8").catch(() => null)
		if (token) return token.trim()
	}

	console.info("No access token found, logging in...")

	const auth = new MatrixAuth(config.account.homeserver_url)
	const client = await auth.passwordLogin(config.account.username, config.account.password)

	await fs.mkdir(config.storage.path, { recursive: true })
	await fs.writeFile(tokenPath, client.accessToken, "utf-8")

	return client.accessToken
}