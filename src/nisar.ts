import type { Context } from "hono";
import { z } from "zod";

const CMR_COLLECTION_ID = "C2854338529-ASF";
const CMR_GRANULES_URL = "https://cmr.earthdata.nasa.gov/search/granules.json";

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

	const params = new URLSearchParams({
		collection_concept_id: CMR_COLLECTION_ID,
		bounding_box: bounds.join(","),
		page_size: "20",
		sort_key: "-start_date",
	});
	if (from && to) {
		params.set("temporal", `${from}T00:00:00Z,${to}T23:59:59Z`);
	}

	let response: Response;
	try {
		response = await fetch(`${CMR_GRANULES_URL}?${params}`, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(12_000),
		});
	} catch (error) {
		console.error("NISAR catalog request failed", error);
		return c.json({ error: "NASA's catalog could not be reached. Try again shortly." }, 502);
	}

	if (!response.ok) {
		console.error("NISAR catalog returned an error", response.status);
		return c.json({ error: `NASA's catalog returned HTTP ${response.status}.` }, 502);
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch (error) {
		console.error("NISAR catalog returned invalid JSON", error);
		return c.json({ error: "NASA's catalog returned unreadable metadata." }, 502);
	}

	const parsedBody = cmrResponseSchema.safeParse(body);
	if (!parsedBody.success) {
		console.error("NISAR catalog response did not match the expected format");
		return c.json({ error: "NASA's catalog returned unexpected metadata." }, 502);
	}

	const granules = parsedBody.data.feed.entry.map((granule) => {
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

	return c.json({
		collection: "NISAR Provisional L2 GCOV v1",
		collectionUrl: `https://search.earthdata.nasa.gov/search/granules?p=${CMR_COLLECTION_ID}`,
		granules,
	});
}
