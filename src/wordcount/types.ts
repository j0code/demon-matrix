import { ParsedUser } from "../types.js"

export interface Message {
	text: string,
	wordCounts: Map<string, number>,
	author: ParsedUser,
	room: {
		id: string
	},
	ts: string
}