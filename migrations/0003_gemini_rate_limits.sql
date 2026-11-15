CREATE TABLE gemini_rate_limits (
	client_hash TEXT PRIMARY KEY,
	last_request_ms INTEGER NOT NULL
);
