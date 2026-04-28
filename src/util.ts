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

export function parseUserId(user_id: string): { name: string, domain: string} {
	if (user_id.startsWith("@")) user_id = user_id.slice(1)
	if (!user_id.includes(":")) return { name: user_id, domain: "" }

	const [name, domain] = user_id.split(":") as [string, string]

	return { name, domain: domain || "" }
}