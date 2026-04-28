export type DictionaryEntry = {
	word: string,
	word_idx: number,
	language: string
}

export type Author = {
	author_idx: number
	author_name: string
	author_domain: string
	author_uid: string
	is_bot: boolean
}

export type Room = {
	room_idx: number
	room_tag: string
}

export type Word = {
	word_idx: number
	author_idx: number
	room_idx: number
	ts: number,
	count: number
}