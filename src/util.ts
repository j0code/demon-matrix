import { MatrixClient } from "matrix-bot-sdk"
import { ParsedUser } from "./types.js"

export function dateToTimestamp(isoDateString: string): BigInt {
	const unixTime = Date.parse(isoDateString)
	if (isNaN(unixTime)) {
		throw new Error(`Invalid ISO date string: ${isoDateString}`)
	}
	return BigInt(unixTime) / 1000n
}

export function timestampToDate(timestamp: BigInt): string {
	const date = new Date(Number(timestamp) * 1000)
	return date.toISOString()
}

export function parseUserId(user_id: string): ParsedUser {
	if (user_id.startsWith("@")) user_id = user_id.slice(1)
	if (!user_id.includes(":")) return { name: user_id, domain: "", tag: `@${user_id}` }

	const [name, domain] = user_id.split(":") as [string, string]

	return { name, domain, tag: `@${name}:${domain}` }
}

export function codeblockTable(content: (string | number)[][], gap: string = " ") {
	const lengths: number[] = []

	for (const row of content) {
		for (let i = 0; i < row.length; i++) {
			const columnLength = lengths[i]!
			const cell = String(row[i]!)
			if (!columnLength || cell.length > columnLength) {
				lengths[i] = cell.length
			}
		}
	}

	const lines: string[] = []
	for (const row of content) {
		const line: string[] = []
		for (let i = 0; i < row.length; i++) {
			const cell = row[i]!
			const columnLength = lengths[i]!
			let paddedCell: string

			if (typeof cell == "string") {
				paddedCell = row[i] + " ".repeat(columnLength - cell.length)
			} else {
				paddedCell = " ".repeat(columnLength - String(cell).length) + cell
			}

			line.push(paddedCell)
		}
		lines.push(line.join(gap))
	}

	return codeblock(lines.join("\n"), "javascript")
}

export function escapeHtml(text: string) {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
}

export function codeblock(content: string, language: string = "plain") {
	return `<pre><code class="language-${language}">${escapeHtml(content)}</code></pre>`
}

type FileOptions = {
	size: number,
	mimetype: string
	filename: string
	url: string,
	caption?: string
}

export function sendFile(client: MatrixClient, room: string, file: FileOptions) {
	client.sendMessage(room, {
		body:     file.caption || file.filename,
		filename: file.filename,
		info: {
			size:     file.size,
			mimetype: file.mimetype
		},
		msgtype: "m.file",
		url: file.url
	})
}