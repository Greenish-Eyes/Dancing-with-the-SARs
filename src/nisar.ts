import type { Context } from "hono";
import { z } from "zod";

const CMR_COLLECTION_ID = "C2854338529-ASF";
const CMR_GRANULES_URL = "https://cmr.earthdata.nasa.gov/search/granules.json";
const CATALOG_CACHE_TTL_SECONDS = 60 * 60;

const querySchema = z.object({
	bbox: z.string(),
	from: z.iso.date().optional(),
	to: z.iso.date().optional(),
});

const cmrLinkSchema = z.object({
	rel: z.string(),
	title: z.string().optional(),
	href: z.string(),
});

const cmrGranuleSchema = z.object({
	id: z.string(),
	title: z.string(),
	time_start: z.string(),
	time_end: z.string().optional(),
	producer_granule_id: z.string().optional(),
	polygons: z.array(z.array(z.string())).optional(),
	links: z.array(cmrLinkSchema).optional(),
});

const cmrResponseSchema = z.object({
	feed: z.object({
		entry: z.array(cmrGranuleSchema),
	}),
});

type AppContext = Context<{ Bindings: Env }>;

export type Granule = {
	id: string;
	title: string;
	timeStart: string;
	timeEnd: string | null;
	footprint: number[][] | null;
	browseUrl: string | null;
	browseChannels: { frequency: string | undefined; polarization: string | undefined; href: string }[];
	downloadUrl: string | null;
};

export class CmrError extends Error {
	status: number;
	constructor(message: string, status = 502) {
		super(message);
		this.status = status;
	}
}

function parseFootprint(polygons: string[][] | undefined): number[][] | null {
	const coordinates = polygons?.[0]?.[0]?.trim().split(/\s+/).map(Number);
	if (!coordinates || coordinates.length < 8 || coordinates.length % 2 !== 0) {
		return null;
	}

	const points: number[][] = [];
	for (let index = 0; index < coordinates.length; index += 2) {
		const latitude = coordinates[index];
		const longitude = coordinates[index + 1];
		if (
			latitude === undefined ||
			longitude === undefined ||
			!Number.isFinite(latitude) ||
			!Number.isFinite(longitude)
		) {
			return null;
		}
		points.push([latitude, longitude]);
	}

	return points;
}

// Snap the box outward to 0.1 degrees so near-identical map views share one cache entry.
function snapBounds(bounds: number[]): number[] {
	const [west, south, east, north] = bounds as [number, number, number, number];
	const snap = (value: number, round: (n: number) => number) => round(value * 10) / 10;
	return [
		Math.max(-180, snap(west, Math.floor)),
		Math.max(-90, snap(south, Math.floor)),
		Math.min(180, snap(east, Math.ceil)),
		Math.min(90, snap(north, Math.ceil)),
	];
}

/** Ask NASA CMR for NISAR GCOV granules in a box. Throws CmrError with a user-safe message. */
export async function fetchCmrGranules(
	bounds: number[],
	range: { from: string; to: string } | null,
	pageSize = 20,
): Promise<Granule[]> {
	const params = new URLSearchParams({
		collection_concept_id: CMR_COLLECTION_ID,
		bounding_box: bounds.join(","),
		page_size: String(pageSize),
		sort_key: "-start_date",
	});
	if (range) {
		params.set("temporal", `${range.from}T00:00:00Z,${range.to}T23:59:59Z`);
	}

	let response: Response;
	try {
		response = await fetch(`${CMR_GRANULES_URL}?${params}`, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(12_000),
		});
	} catch (error) {
		console.error("NISAR catalog request failed", error);
		throw new CmrError("NASA's catalog could not be reached. Try again shortly.");
	}

	if (!response.ok) {
		console.error("NISAR catalog returned an error", response.status);
		throw new CmrError(`NASA's catalog returned HTTP ${response.status}.`);
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch (error) {
		console.error("NISAR catalog returned invalid JSON", error);
		throw new CmrError("NASA's catalog returned unreadable metadata.");
	}

	const parsedBody = cmrResponseSchema.safeParse(body);
	if (!parsedBody.success) {
		console.error("NISAR catalog response did not match the expected format");
		throw new CmrError("NASA's catalog returned unexpected metadata.");
	}

	return parsedBody.data.feed.entry.map((granule) => {
		const links = granule.links ?? [];
		const browseUrl =
			links.find(
				(link) =>
					link.rel.includes("/browse#") &&
					link.href.startsWith("https://") &&
					link.href.endsWith("_LATLON_thumbnail.png"),
			)?.href ?? null;
		const browseChannels = links.flatMap((link) => {
			const match = link.title?.match(/NATIVE_([AB])_(HHHH|HVHV)\.png$/);
			return match && link.href.startsWith("https://")
				? [{ frequency: match[1], polarization: match[2], href: link.href }]
				: [];
		});
		const downloadUrl =
			links.find(
				(link) =>
					link.rel.includes("/data#") &&
					link.href.startsWith("https://") &&
					link.href.endsWith(".h5"),
			)?.href ?? null;

		return {
			id: granule.id,
			title: granule.producer_granule_id ?? granule.title,
			timeStart: granule.time_start,
			timeEnd: granule.time_end ?? null,
			footprint: parseFootprint(granule.polygons),
			browseUrl,
			browseChannels,
			downloadUrl,
		};
	});
}

type GranuleRow = {
	id: string;
	title: string;
	time_start: string;
	time_end: string | null;
	footprint: string | null;
	browse_url: string | null;
	browse_channels: string;
	download_url: string | null;
};

function parseJson<T>(value: string | null, fallback: T): T {
	if (!value) return fallback;
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}

/** Last-resort answer from our own D1 copy when NASA's catalog is down. */
async function granulesFromD1(
	db: D1Database,
	bounds: number[],
	from: string | undefined,
	to: string | undefined,
): Promise<Granule[]> {
	const [west, south, east, north] = bounds as [number, number, number, number];
	const { results } = await db
		.prepare(
			`SELECT DISTINCT id, title, time_start, time_end, footprint, browse_url, browse_channels, download_url
			 FROM granules
			 WHERE west <= ?1 AND east >= ?2 AND south <= ?3 AND north >= ?4
			   AND (?5 IS NULL OR time_start >= ?5) AND (?6 IS NULL OR time_start <= ?6)
			 ORDER BY time_start DESC LIMIT 20`,
		)
		.bind(east, west, north, south, from ? `${from}T00:00:00Z` : null, to ? `${to}T23:59:59Z` : null)
		.all<GranuleRow>();
	return results.map((row) => ({
		id: row.id,
		title: row.title,
		timeStart: row.time_start,
		timeEnd: row.time_end,
		footprint: parseJson<number[][] | null>(row.footprint, null),
		browseUrl: row.browse_url,
		browseChannels: parseJson(row.browse_channels, []),
		downloadUrl: row.download_url,
	}));
}

export async function listNisarGranules(c: AppContext) {
	const parsedQuery = querySchema.safeParse(c.req.query());
	if (!parsedQuery.success) {
		return c.json({ error: "Provide a bounding box and valid ISO dates." }, 400);
	}

	const { bbox, from, to } = parsedQuery.data;
	const bounds = bbox.split(",").map(Number);
	if (
		bounds.length !== 4 ||
		bounds.some((value) => !Number.isFinite(value)) ||
		bounds[0]! < -180 ||
		bounds[2]! > 180 ||
		bounds[1]! < -90 ||
		bounds[3]! > 90 ||
		bounds[0]! >= bounds[2]! ||
		bounds[1]! >= bounds[3]!
	) {
		return c.json(
			{ error: "Bounding box must be west,south,east,north in geographic ranges." },
			400,
		);
	}

	if ((from && !to) || (!from && to) || (from && to && from > to)) {
		return c.json(
			{ error: "Choose both dates, with the start date no later than the end date." },
			400,
		);
	}
	if (
		from &&
		to &&
		Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`) >
			366 * 24 * 60 * 60 * 1000
	) {
		return c.json({ error: "Date ranges cannot exceed one year." }, 400);
	}

	const snapped = snapBounds(bounds);
	const cacheKey = `granules:v1:${snapped.join(",")}:${from ?? "any"}:${to ?? "any"}`;
	try {
		const cached = await c.env.CACHE?.get(cacheKey, "json");
		if (cached) {
			return c.json(cached, 200, { "X-Cache": "HIT" });
		}
	} catch (error) {
		console.error("Catalog cache read failed", error);
	}

	const collection = {
		collection: "NISAR Provisional L2 GCOV v1",
		collectionUrl: `https://search.earthdata.nasa.gov/search/granules?p=${CMR_COLLECTION_ID}`,
	};

	let granules: Granule[];
	try {
		granules = await fetchCmrGranules(snapped, from && to ? { from, to } : null);
	} catch (error) {
		if (c.env.fieldnotes_db) {
			try {
				const stored = await granulesFromD1(c.env.fieldnotes_db, snapped, from, to);
				if (stored.length > 0) {
					return c.json({ ...collection, granules: stored }, 200, { "X-Cache": "D1" });
				}
			} catch (dbError) {
				console.error("Stored catalog lookup failed", dbError);
			}
		}
		const status = error instanceof CmrError ? error.status : 502;
		const message = error instanceof CmrError ? error.message : "NASA's catalog request failed.";
		return c.json({ error: message }, status as 502);
	}

	const payload = { ...collection, granules };
	try {
		await c.env.CACHE?.put(cacheKey, JSON.stringify(payload), {
			expirationTtl: CATALOG_CACHE_TTL_SECONDS,
		});
	} catch (error) {
		console.error("Catalog cache write failed", error);
	}
	return c.json(payload, 200, { "X-Cache": "MISS" });
}
