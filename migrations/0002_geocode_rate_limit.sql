CREATE TABLE geocode_rate_limit (
	singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
	last_request_ms INTEGER NOT NULL
);
INSERT INTO geocode_rate_limit (singleton, last_request_ms) VALUES (1, 0);
