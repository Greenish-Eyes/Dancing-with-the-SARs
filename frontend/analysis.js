/* Scene analytics for NISAR GCOV catalog results. Pure functions, no dependencies.
   Works on CMR metadata only; pixel-level statistics live in analysis/gcov_analyze.py. */
(function (root) {
	const DAY = 86400000;
	const NAME_RE = /NISAR_L2_[A-Z]{2}_GCOV_(\d{3})_(\d{3})_([AD])_(\d{3})_/;

	function parseGranuleName(title) {
		const m = NAME_RE.exec(title || "");
		if (!m) return { cycle: null, track: null, direction: null, frame: null };
		return { cycle: +m[1], track: +m[2], direction: m[3], frame: +m[4] };
	}

	function geometryKey(g) {
		const p = parseGranuleName(g.title);
		return p.track === null ? null : `T${p.track}-${p.direction}-F${p.frame}`;
	}

	function median(values) {
		if (!values.length) return null;
		const s = [...values].sort((a, b) => a - b);
		const h = s.length >> 1;
		return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
	}

	// Footprint points are [lat, lon]. Local equirectangular shoelace area in km².
	function footprintAreaKm2(footprint) {
		if (!footprint || footprint.length < 3) return null;
		const lat0 = footprint.reduce((s, p) => s + p[0], 0) / footprint.length;
		const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
		const ky = 110.57;
		let area = 0;
		for (let i = 0; i < footprint.length; i++) {
			const [la1, lo1] = footprint[i];
			const [la2, lo2] = footprint[(i + 1) % footprint.length];
			area += lo1 * kx * (la2 * ky) - lo2 * kx * (la1 * ky);
		}
		return Math.abs(area) / 2;
	}

	// Previous acquisition that is geometrically comparable (same track, frame, direction).
	// Falls back to "unknown" when names cannot be parsed so the UI can warn instead of guessing.
	function comparablePrevious(granules, granule) {
		const sorted = [...granules].sort((a, b) => b.timeStart.localeCompare(a.timeStart));
		const key = geometryKey(granule);
		const later = sorted.slice(sorted.findIndex((g) => g.id === granule.id) + 1);
		if (key === null) {
			return { previous: later[0] ?? null, verified: false, reason: "Track/frame could not be read from the granule name; geometry match is unverified." };
		}
		const match = later.find((g) => geometryKey(g) === key);
		return match
			? { previous: match, verified: true, reason: `Same ${key}` }
			: { previous: null, verified: true, reason: `No earlier pass with matching geometry (${key}).` };
	}

	function analyze(granules) {
		const sorted = [...granules].sort((a, b) => a.timeStart.localeCompare(b.timeStart));
		const out = { count: sorted.length, first: null, last: null, spanDays: 0, medianRevisitDays: null, maxGapDays: null,
			gaps: [], groups: [], comparablePairs: 0, unparsed: 0, monthly: {}, medianAreaKm2: null, warnings: [] };
		if (!sorted.length) return out;
		out.first = sorted[0].timeStart; out.last = sorted[sorted.length - 1].timeStart;
		out.spanDays = Math.round((Date.parse(out.last) - Date.parse(out.first)) / DAY);
		const groups = new Map();
		for (const g of sorted) {
			const key = geometryKey(g);
			if (key === null) { out.unparsed++; continue; }
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key).push(g);
			const month = g.timeStart.slice(0, 7);
			out.monthly[month] = (out.monthly[month] ?? 0) + 1;
		}
		for (const [key, list] of groups) {
			const gaps = list.slice(1).map((g, i) => (Date.parse(g.timeStart) - Date.parse(list[i].timeStart)) / DAY);
			out.groups.push({ key, count: list.length, first: list[0].timeStart, last: list[list.length - 1].timeStart,
				medianRevisitDays: median(gaps) === null ? null : +median(gaps).toFixed(1) });
			out.comparablePairs += Math.max(0, list.length - 1);
			list.slice(1).forEach((g, i) => out.gaps.push({ key, from: list[i].timeStart, to: g.timeStart, days: +gaps[i].toFixed(1) }));
		}
		out.groups.sort((a, b) => b.count - a.count);
		const allGaps = out.gaps.map((g) => g.days);
		out.medianRevisitDays = allGaps.length ? +median(allGaps).toFixed(1) : null;
		out.maxGapDays = allGaps.length ? Math.max(...allGaps) : null;
		const areas = sorted.map((g) => footprintAreaKm2(g.footprint)).filter((a) => a !== null);
		out.medianAreaKm2 = areas.length ? Math.round(median(areas)) : null;
		if (out.unparsed) out.warnings.push(`${out.unparsed} scene(s) have non-standard names; geometry grouping skipped for them.`);
		if (sorted.length > 1 && out.comparablePairs === 0) out.warnings.push("No two passes share track, frame and direction: do not difference these scenes.");
		if (sorted.length >= 100) out.warnings.push("Result hit the 100-scene cap; older passes may be missing. Narrow the area or date window.");
		return out;
	}

	function csvCell(v) { return `"${String(v ?? "").replace(/"/g, '""')}"`; }

	function toCsv(granules, siteName) {
		const header = ["acquisition_utc", "end_utc", "title", "cycle", "track", "direction", "frame", "footprint_km2",
			"area_name", "west", "south", "east", "north", "browse_url", "download_url", "provisional"];
		const rows = granules.map((g) => {
			const p = parseGranuleName(g.title);
			const pts = g.footprint ?? [];
			const ext = pts.length >= 4
				? [Math.min(...pts.map((x) => x[1])), Math.min(...pts.map((x) => x[0])), Math.max(...pts.map((x) => x[1])), Math.max(...pts.map((x) => x[0]))]
				: ["", "", "", ""];
			const a = footprintAreaKm2(g.footprint);
			return [g.timeStart, g.timeEnd ?? "", g.title, p.cycle, p.track, p.direction, p.frame, a === null ? "" : Math.round(a),
				siteName, ...ext, g.browseUrl ?? "", g.downloadUrl ?? "", "true"];
		});
		return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
	}

	function toGeoJson(granules) {
		return {
			type: "FeatureCollection",
			features: granules.filter((g) => g.footprint && g.footprint.length >= 4).map((g) => {
				const ring = g.footprint.map(([lat, lon]) => [lon, lat]);
				ring.push(ring[0]);
				return { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] },
					properties: { id: g.id, title: g.title, timeStart: g.timeStart, ...parseGranuleName(g.title), downloadUrl: g.downloadUrl } };
			}),
		};
	}

	const api = { parseGranuleName, geometryKey, footprintAreaKm2, comparablePrevious, analyze, toCsv, toGeoJson };
	if (typeof module !== "undefined") module.exports = api; else root.SurfaceAnalysis = api;
})(typeof window !== "undefined" ? window : globalThis);
