CREATE TABLE IF NOT EXISTS dictionary (
	word_idx INTEGER PRIMARY KEY,
	word     TEXT NOT NULL UNIQUE,
	language TEXT
);

CREATE TABLE IF NOT EXISTS authors (
	author_idx    INTEGER PRIMARY KEY,
	author_name   TEXT NOT NULL,
	author_domain TEXT NOT NULL,
	author_uid    TEXT NOT NULL UNIQUE,
	is_bot        BOOLEAN NOT NULL,
	UNIQUE(author_name, author_domain)
);

CREATE TABLE IF NOT EXISTS rooms (
	room_idx INTEGER PRIMARY KEY,
	room_tag TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS words (
	word_idx   INTEGER NOT NULL,
	author_idx INTEGER NOT NULL,
	room_idx   INTEGER NOT NULL,
	ts         INTEGER NOT NULL,
	count      INTEGER NOT NULL,
	FOREIGN KEY (word_idx)   REFERENCES dictionary(word_idx),
	FOREIGN KEY (author_idx) REFERENCES authors(author_idx),
	FOREIGN KEY (room_idx)   REFERENCES rooms(room_idx)
);