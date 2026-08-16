export interface Config {
	account: {
		homeserver_url: string
		username: string
		password: string
	},
	storage: {
		path: string
	}
}

export interface ParsedUserName {
	name: string,
	domain: string
	id: string
}

export interface ParsedUser extends ParsedUserName {
	is_bot: boolean
}