-- NISAR passes seen at the study sites, plus a log of each hourly check.
CREATE TABLE granules (
	id TEXT NOT NULL,
	site TEXT NOT NULL,
	title TEXT NOT NULL,
	time_start TEXT NOT NULL,
	time_end TEXT,
	west REAL,
	south REAL,
	east REAL,
	north REAL,
	footprint TEXT,
	browse_url TEXT,
	browse_channels TEXT NOT NULL DEFAULT '[]',
	download_url TEXT,
	first_seen_at INTEGER NOT NULL,
	backfill INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (id, site)
);
CREATE INDEX idx_granules_site_time ON granules (site, time_start DESC);
CREATE INDEX idx_granules_first_seen ON granules (first_seen_at DESC);

CREATE TABLE ingest_runs (
	id INTEGER PRIMARY KEY,
	ran_at INTEGER NOT NULL,
	site TEXT NOT NULL,
	status TEXT NOT NULL,
	found INTEGER NOT NULL DEFAULT 0,
	inserted INTEGER NOT NULL DEFAULT 0,
	error TEXT
);
CREATE INDEX idx_ingest_runs_ran_at ON ingest_runs (ran_at DESC);
