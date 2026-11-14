import type { Context } from "hono";
import { fetchCmrGranules, type Granule } from "./nisar";
import { SITES, type SiteId } from "./sites";

type AppContext = Context<{ Bindings: Env }>;

const BACKFILL_DAYS = 365;
const REFRESH_DAYS = 14;
const PAGE_SIZE = 50;
const NEW_PASS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isoDate(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

function bboxOf(footprint: number[][] | null) {
	if (!footprint || footprint.length === 0) return { west: null, south: null, east: null, north: null };
	const lats = footprint.map((point) => point[0]!);
	const lons = footprint.map((point) => point[1]!);
	return {
		west: Math.min(...lons),
		south: Math.min(...lats),
		east: Math.max(...lons),
		north: Math.max(...lats),
	};
}

/** Insert all granules for one site in a single statement (D1 limits queries per invocation). */
async function storeGranules(db: D1Database, site: SiteId, granules: Granule[], backfill: boolean, now: number) {
	if (granules.length === 0) return 0;
	const rows = granules.map((granule) => ({
		id: granule.id,
		title: granule.title,
		timeStart: granule.timeStart,
		timeEnd: granule.timeEnd,
		...bboxOf(granule.footprint),
		footprint: granule.footprint ? JSON.stringify(granule.footprint) : null,
		browseUrl: granule.browseUrl,
		browseChannels: JSON.stringify(granule.browseChannels),
		downloadUrl: granule.downloadUrl,
	}));
	const result = await db
		.prepare(
			`INSERT OR IGNORE INTO granules
			   (id, site, title, time_start, time_end, west, south, east, north, footprint, browse_url, browse_channels, download_url, first_seen_at, backfill)
			 SELECT json_extract(value, '$.id'), ?2, json_extract(value, '$.title'),
			        json_extract(value, '$.timeStart'), json_extract(value, '$.timeEnd'),
			        json_extract(value, '$.west'), json_extract(value, '$.south'),
			        json_extract(value, '$.east'), json_extract(value, '$.north'),
			        json_extract(value, '$.footprint'), json_extract(value, '$.browseUrl'),
			        json_extract(value, '$.browseChannels'), json_extract(value, '$.downloadUrl'),
			        ?3, ?4
			 FROM json_each(?1)`,
		)
		.bind(JSON.stringify(rows), site, now, backfill ? 1 : 0)
		.run();
	return result.meta.changes ?? 0;
}

async function logRun(
	db: D1Database,
	now: number,
	site: SiteId,
	status: "ok" | "error",
	found: number,
	inserted: number,
	error?: string,
) {
	await db
		.prepare("INSERT INTO ingest_runs (ran_at, site, status, found, inserted, error) VALUES (?, ?, ?, ?, ?, ?)")
		.bind(now, site, status, found, inserted, error ?? null)
		.run();
}

/** Check CMR for each study site and keep any pass we have not seen before. */
export async function ingestAllSites(env: Env) {
	if (!env.fieldnotes_db) {
		console.error("Ingest skipped: no D1 binding.");
		return;
	}
	const now = Date.now();
	for (const [siteId, site] of Object.entries(SITES) as [SiteId, (typeof SITES)[SiteId]][]) {
		try {
			const existing = await env.fieldnotes_db
				.prepare("SELECT COUNT(*) AS n FROM granules WHERE site = ?")
				.bind(siteId)
				.first<{ n: number }>();
			const firstRun = (existing?.n ?? 0) === 0;
			const days = firstRun ? BACKFILL_DAYS : REFRESH_DAYS;
			const granules = await fetchCmrGranules(
				[...site.bounds],
				{ from: isoDate(now - days * 24 * 60 * 60 * 1000), to: isoDate(now) },
				PAGE_SIZE,
			);
			const inserted = await storeGranules(env.fieldnotes_db, siteId, granules, firstRun, now);
			await logRun(env.fieldnotes_db, now, siteId, "ok", granules.length, inserted);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown ingest error";
			console.error(`Ingest failed for ${siteId}`, error);
			try {
				await logRun(env.fieldnotes_db, now, siteId, "error", 0, 0, message);
			} catch (logError) {
				console.error("Could not log ingest failure", logError);
			}
		}
	}
}

type FeedRow = {
	id: string;
	site: string;
	title: string;
	time_start: string;
	first_seen_at: number;
	is_new: number;
};

/** GET /api/nisar/feed — newest stored passes across the study sites. */
export async function passFeed(c: AppContext) {
	if (!c.env.fieldnotes_db) {
		return c.json({ lastChecked: null, passes: [] });
	}
	const siteParam = c.req.query("site");
	const site = siteParam && siteParam in SITES ? siteParam : null;
	const limit = Math.min(Math.max(Number(c.req.query("limit")) || 8, 1), 30);

	try {
		const [passes, last] = await Promise.all([
			c.env.fieldnotes_db
				.prepare(
					`SELECT id, site, title, time_start, first_seen_at,
					        (backfill = 0 AND first_seen_at > ?1) AS is_new
					 FROM granules
					 WHERE (?2 IS NULL OR site = ?2)
					 ORDER BY time_start DESC LIMIT ?3`,
				)
				.bind(Date.now() - NEW_PASS_WINDOW_MS, site, limit)
				.all<FeedRow>(),
			c.env.fieldnotes_db
				.prepare("SELECT MAX(ran_at) AS ran_at FROM ingest_runs WHERE status = 'ok'")
				.first<{ ran_at: number | null }>(),
		]);
		return c.json({
			lastChecked: last?.ran_at ?? null,
			passes: passes.results.map((row) => ({
				id: row.id,
				site: row.site,
				title: row.title,
				timeStart: row.time_start,
				firstSeenAt: row.first_seen_at,
				isNew: row.is_new === 1,
			})),
		});
	} catch (error) {
		console.error("Pass feed query failed", error);
		return c.json({ error: "The pass feed is unavailable right now." }, 502);
	}
}
