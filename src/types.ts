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

export interface ParsedUser {
	name: string,
	domain: string,
	tag: string
}