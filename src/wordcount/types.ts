export interface Message {
	text: string,
	author: {
		author_tag: string,
		author_uid: string,
		is_bot: boolean
	},
	room: {
		room_tag: string
	},
	ts: string
}

export interface MessageParsed {
	text: string,
	wordCounts: Map<string, number>,
	author: {
		author_tag: string,
		author_name: string,
		author_domain: string,
		author_uid: string,
		is_bot: boolean
	},
	room: {
		room_tag: string
	},
	ts: string
}