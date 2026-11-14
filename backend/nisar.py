import json
import re
from datetime import datetime, timedelta, timezone
from math import ceil, floor
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse

CMR_COLLECTION_ID = "C2854338529-ASF"
CMR_GRANULES_URL = "https://cmr.earthdata.nasa.gov/search/granules.json"
COLLECTION = {
    "collection": "NISAR Provisional L2 GCOV v1",
    "collectionUrl": f"https://search.earthdata.nasa.gov/search/granules?p={CMR_COLLECTION_ID}",
}
SITES = {
    "amazon": {"name": "Amazon floodplain", "bounds": [-61, -4, -59, -2]},
    "louisiana": {"name": "Mississippi Delta", "bounds": [-91, 28, -89, 31]},
    "iceland": {"name": "South Iceland", "bounds": [-20, 63, -18, 65]},
    "jakarta": {"name": "Jakarta basin", "bounds": [106, -7, 108, -5]},
}
BACKFILL_DAYS = 365
REFRESH_DAYS = 14
INGEST_PAGE_SIZE = 50
NEW_PASS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
CATALOG_CACHE_TTL_SECONDS = 60 * 60


class CmrError(Exception):
    def __init__(self, message: str, status: int = 502) -> None:
        super().__init__(message)
        self.status = status


def parse_bounds(value: str) -> list[float] | None:
    try:
        bounds = [float(part) for part in value.split(",")]
    except ValueError:
        return None
    if (
        len(bounds) != 4
        or any(not (-float("inf") < bound < float("inf")) for bound in bounds)
        or bounds[0] < -180
        or bounds[2] > 180
        or bounds[1] < -90
        or bounds[3] > 90
        or bounds[0] >= bounds[2]
        or bounds[1] >= bounds[3]
    ):
        return None
    return bounds


def snap_bounds(bounds: list[float]) -> list[float]:
    west, south, east, north = bounds
    return [
        max(-180, floor(west * 10) / 10),
        max(-90, floor(south * 10) / 10),
        min(180, ceil(east * 10) / 10),
        min(90, ceil(north * 10) / 10),
    ]


def valid_date(value: str) -> bool:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def parse_footprint(polygons: Any) -> list[list[float]] | None:
    polygon = polygons
    while isinstance(polygon, list):
        if not polygon:
            return None
        polygon = polygon[0]
    if not isinstance(polygon, str):
        return None
    try:
        coordinates = [float(part) for part in polygon.strip().split()]
    except ValueError:
        return None
    if len(coordinates) < 8 or len(coordinates) % 2:
        return None
    if any(not (-float("inf") < coordinate < float("inf")) for coordinate in coordinates):
        return None
    return [
        [coordinates[index], coordinates[index + 1]]
        for index in range(0, len(coordinates), 2)
    ]


def parse_cmr_entry(entry: dict[str, Any]) -> dict[str, Any]:
    links = entry.get("links", [])
    browse_url = next(
        (
            link["href"]
            for link in links
            if "browse#" in link.get("rel", "")
            and link.get("href", "").startswith("https://")
            and link["href"].endswith("_LATLON_thumbnail.png")
        ),
        None,
    )
    browse_channels = []
    for link in links:
        match = re.search(r"NATIVE_([AB])_(HHHH|HVHV)\.png$", link.get("title", ""))
        href = link.get("href", "")
        if match and href.startswith("https://"):
            browse_channels.append(
                {"frequency": match.group(1), "polarization": match.group(2), "href": href}
            )
    download_url = next(
        (
            link["href"]
            for link in links
            if "data#" in link.get("rel", "")
            and link.get("href", "").startswith("https://")
            and link["href"].endswith(".h5")
        ),
        None,
    )
    return {
        "id": entry["id"],
        "title": entry.get("producer_granule_id") or entry["title"],
        "timeStart": entry["time_start"],
        "timeEnd": entry.get("time_end"),
        "footprint": parse_footprint(entry.get("polygons")),
        "browseUrl": browse_url,
        "browseChannels": browse_channels,
        "downloadUrl": download_url,
    }


def bbox_of(footprint: list[list[float]] | None) -> dict[str, float | None]:
    if not footprint:
        return {"west": None, "south": None, "east": None, "north": None}
    latitudes = [point[0] for point in footprint]
    longitudes = [point[1] for point in footprint]
    return {
        "west": min(longitudes),
        "south": min(latitudes),
        "east": max(longitudes),
        "north": max(latitudes),
    }


def _date_range(query: dict[str, list[str]]) -> tuple[str | None, str | None] | str:
    start = query.get("from", [None])[0]
    end = query.get("to", [None])[0]
    if (start is None) != (end is None):
        return "Choose both dates, with the start date no later than the end date."
    if start is None or end is None:
        return None, None
    if not valid_date(start) or not valid_date(end) or start > end:
        return "Choose both dates, with the start date no later than the end date."
    if (
        datetime.strptime(end, "%Y-%m-%d") - datetime.strptime(start, "%Y-%m-%d")
    ) > timedelta(days=366):
        return "Date ranges cannot exceed one year."
    return start, end


async def fetch_cmr_granules(
    bounds: list[float],
    date_range: tuple[str, str] | None,
    page_size: int = 20,
) -> list[dict[str, Any]]:
    from js import AbortSignal, Request as JSRequest  # type: ignore[reportMissingModuleSource]
    from workers import fetch
    from runtime import to_js_object

    params = {
        "collection_concept_id": CMR_COLLECTION_ID,
        "bounding_box": ",".join(str(value) for value in bounds),
        "page_size": str(page_size),
        "sort_key": "-start_date",
    }
    if date_range:
        params["temporal"] = f"{date_range[0]}T00:00:00Z,{date_range[1]}T23:59:59Z"
    url = f"{CMR_GRANULES_URL}?{urlencode(params)}"
    try:
        fetch_request = JSRequest.new(
            url,
            to_js_object({"signal": AbortSignal.timeout(12_000)}),
        )
        response = await fetch(fetch_request)
    except Exception as error:
        print(f"NISAR CMR request failed: {error}")
        raise CmrError("NASA's catalog could not be reached. Try again shortly.") from error
    if not response.ok:
        print(f"NISAR CMR returned HTTP {response.status}")
        raise CmrError(f"NASA's catalog returned HTTP {response.status}.")
    try:
        body = json.loads(await response.text())
        entries = body["feed"]["entry"]
        if not isinstance(entries, list):
            raise ValueError("CMR granule entries were not a list.")
        return [parse_cmr_entry(entry) for entry in entries]
    except (KeyError, TypeError, ValueError) as error:
        print(f"NISAR CMR returned unreadable metadata: {error}")
        raise CmrError("NASA's catalog returned unexpected metadata.") from error


async def _granules_from_d1(
    db: Any,
    bounds: list[float],
    start: str | None,
    end: str | None,
) -> list[dict[str, Any]]:
    from runtime import from_js

    west, south, east, north = bounds
    result = await db.prepare(
        """SELECT DISTINCT id, title, time_start, time_end, footprint, browse_url,
                  browse_channels, download_url
           FROM granules
           WHERE west <= ?1 AND east >= ?2 AND south <= ?3 AND north >= ?4
             AND (?5 IS NULL OR time_start >= ?5) AND (?6 IS NULL OR time_start <= ?6)
           ORDER BY time_start DESC LIMIT 20"""
    ).bind(
        east,
        west,
        north,
        south,
        f"{start}T00:00:00Z" if start else None,
        f"{end}T23:59:59Z" if end else None,
    ).all()
    rows = from_js(result.results)
    output = []
    for row in rows:
        output.append(
            {
                "id": row["id"],
                "title": row["title"],
                "timeStart": row["time_start"],
                "timeEnd": row["time_end"],
                "footprint": json.loads(row["footprint"]) if row["footprint"] else None,
                "browseUrl": row["browse_url"],
                "browseChannels": json.loads(row["browse_channels"]),
                "downloadUrl": row["download_url"],
            }
        )
    return output


async def list_nisar_granules(request: Any, env: Any) -> Any:
    from workers import Response

    query = parse_qs(urlparse(str(request.url)).query)
    bounds_value = query.get("bbox", [""])[0]
    bounds = parse_bounds(bounds_value)
    if bounds is None:
        return Response.from_json(
            {"error": "Bounding box must be west,south,east,north in geographic ranges."},
            status=400,
        )
    date_range = _date_range(query)
    if isinstance(date_range, str):
        return Response.from_json({"error": date_range}, status=400)
    start, end = date_range
    snapped = snap_bounds(bounds)
    cache_key = f"granules:v1:{','.join(map(str, snapped))}:{start or 'any'}:{end or 'any'}"
    try:
        cached = await env.CACHE.get(cache_key)
        if cached:
            return Response.from_json(json.loads(cached), headers={"X-Cache": "HIT"})
    except Exception as error:
        print(f"Catalog cache read failed: {error}")

    try:
        granules = await fetch_cmr_granules(snapped, (start, end) if start and end else None)
    except CmrError as error:
        try:
            stored = await _granules_from_d1(env.DB, snapped, start, end)
        except Exception as db_error:
            print(f"Stored catalog lookup failed: {db_error}")
            stored = []
        if stored:
            return Response.from_json(
                {**COLLECTION, "granules": stored}, headers={"X-Cache": "D1"}
            )
        return Response.from_json({"error": str(error)}, status=error.status)

    payload = {**COLLECTION, "granules": granules}
    try:
        await env.CACHE.put(
            cache_key,
            json.dumps(payload),
            {"expirationTtl": CATALOG_CACHE_TTL_SECONDS},
        )
    except Exception as error:
        print(f"Catalog cache write failed: {error}")
    return Response.from_json(payload, headers={"X-Cache": "MISS"})


async def _store_granules(db: Any, site: str, granules: list[dict[str, Any]], backfill: bool, now: int) -> int:
    rows = []
    for granule in granules:
        rows.append(
            {
                "id": granule["id"],
                "title": granule["title"],
                "timeStart": granule["timeStart"],
                "timeEnd": granule["timeEnd"],
                **bbox_of(granule["footprint"]),
                "footprint": json.dumps(granule["footprint"]) if granule["footprint"] else None,
                "browseUrl": granule["browseUrl"],
                "browseChannels": json.dumps(granule["browseChannels"]),
                "downloadUrl": granule["downloadUrl"],
            }
        )
    if not rows:
        return 0
    result = await db.prepare(
        """INSERT OR IGNORE INTO granules
           (id, site, title, time_start, time_end, west, south, east, north, footprint,
            browse_url, browse_channels, download_url, first_seen_at, backfill)
           SELECT json_extract(value, '$.id'), ?2, json_extract(value, '$.title'),
                  json_extract(value, '$.timeStart'), json_extract(value, '$.timeEnd'),
                  json_extract(value, '$.west'), json_extract(value, '$.south'),
                  json_extract(value, '$.east'), json_extract(value, '$.north'),
                  json_extract(value, '$.footprint'), json_extract(value, '$.browseUrl'),
                  json_extract(value, '$.browseChannels'), json_extract(value, '$.downloadUrl'),
                  ?3, ?4
           FROM json_each(?1)"""
    ).bind(json.dumps(rows), site, now, 1 if backfill else 0).run()
    return int(result.meta.changes or 0)


async def _log_ingest(db: Any, now: int, site: str, status: str, found: int, inserted: int, error: str | None = None) -> None:
    await db.prepare(
        "INSERT INTO ingest_runs (ran_at, site, status, found, inserted, error) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(now, site, status, found, inserted, error).run()


async def ingest_all_sites(env: Any) -> None:
    from runtime import from_js

    now = int(datetime.now(timezone.utc).timestamp() * 1000)
    for site_id, site in SITES.items():
        try:
            count_row = await env.DB.prepare(
                "SELECT COUNT(*) AS n FROM granules WHERE site = ?"
            ).bind(site_id).first()
            first_run = int(from_js(count_row)["n"]) == 0
            days = BACKFILL_DAYS if first_run else REFRESH_DAYS
            end_date = datetime.fromtimestamp(now / 1000, timezone.utc).date()
            start_date = end_date - timedelta(days=days)
            granules = await fetch_cmr_granules(
                site["bounds"],
                (start_date.isoformat(), end_date.isoformat()),
                INGEST_PAGE_SIZE,
            )
            inserted = await _store_granules(env.DB, site_id, granules, first_run, now)
            await _log_ingest(env.DB, now, site_id, "ok", len(granules), inserted)
        except Exception as error:
            message = str(error) or "Unknown ingest error"
            print(f"Ingest failed for {site_id}: {message}")
            try:
                await _log_ingest(env.DB, now, site_id, "error", 0, 0, message)
            except Exception as log_error:
                print(f"Could not log ingest failure for {site_id}: {log_error}")


async def pass_feed(request: Any, env: Any) -> Any:
    from runtime import from_js
    from workers import Response

    query = parse_qs(urlparse(str(request.url)).query)
    site = query.get("site", [None])[0]
    if site and site not in SITES:
        return Response.from_json(
            {"error": "Choose a supported study site."}, status=400
        )
    try:
        limit = int(query.get("limit", ["8"])[0])
    except (TypeError, ValueError):
        return Response.from_json(
            {"error": "Limit must be an integer from 1 to 30."}, status=400
        )
    if not 1 <= limit <= 30:
        return Response.from_json(
            {"error": "Limit must be an integer from 1 to 30."}, status=400
        )

    try:
        cutoff = int(datetime.now(timezone.utc).timestamp() * 1000) - NEW_PASS_WINDOW_MS
        passes_result = await env.DB.prepare(
            """SELECT id, site, title, time_start, first_seen_at,
                      (backfill = 0 AND first_seen_at > ?1) AS is_new
               FROM granules
               WHERE (?2 IS NULL OR site = ?2)
               ORDER BY time_start DESC LIMIT ?3"""
        ).bind(cutoff, site, limit).all()
        last_result = await env.DB.prepare(
            "SELECT MAX(ran_at) AS ran_at FROM ingest_runs WHERE status = 'ok'"
        ).first()
        passes = from_js(passes_result.results)
        last_checked = from_js(last_result)["ran_at"] if last_result else None
        return Response.from_json(
            {
                "lastChecked": last_checked,
                "passes": [
                    {
                        "id": row["id"],
                        "site": row["site"],
                        "title": row["title"],
                        "timeStart": row["time_start"],
                        "firstSeenAt": row["first_seen_at"],
                        "isNew": row["is_new"] == 1,
                    }
                    for row in passes
                ],
            }
        )
    except Exception as error:
        print(f"Pass feed query failed: {error}")
        return Response.from_json(
            {"error": "The pass feed is unavailable right now."}, status=502
        )
