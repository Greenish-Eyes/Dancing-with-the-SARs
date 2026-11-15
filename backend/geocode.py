import hashlib
import json
import math
import re
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse

DEFAULT_GEOCODER_URL = "https://nominatim.openstreetmap.org"
GEOCODE_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60
MAX_QUERY_LENGTH = 120
USER_AGENT = (
    "Surface Signals NISAR explorer/1.0 "
    "(https://github.com/Greenish-Eyes/Dancing-with-the-SARs)"
)
RATE_LIMIT_SQL = """
UPDATE geocode_rate_limit
SET last_request_ms = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)
WHERE singleton = 1
  AND last_request_ms <= CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER) - 1000
"""


def normalize_place_query(value: str) -> str | None:
    query = re.sub(r"\s+", " ", value).strip()
    if len(query) < 2 or len(query) > MAX_QUERY_LENGTH or any(ord(char) < 32 for char in query):
        return None
    return query


def parse_nominatim_results(entries: Any) -> list[dict[str, Any]]:
    if not isinstance(entries, list):
        raise ValueError("The place search provider returned an invalid result list.")
    places = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        try:
            latitude = float(entry["lat"])
            longitude = float(entry["lon"])
            south, north, west, east = [float(value) for value in entry["boundingbox"]]
            display_name = str(entry["display_name"]).strip()
        except (KeyError, TypeError, ValueError):
            continue
        if (
            not display_name
            or not all(math.isfinite(value) for value in (latitude, longitude, south, north, west, east))
            or not -90 <= south < north <= 90
            or not -180 <= west < east <= 180
            or not -90 <= latitude <= 90
            or not -180 <= longitude <= 180
        ):
            continue
        address = entry.get("address")
        if not isinstance(address, dict):
            address = {}
        name = str(entry.get("name") or display_name.split(",", 1)[0]).strip()
        region = str(address.get("state") or address.get("region") or address.get("country") or "SELECTED REGION")
        places.append(
            {
                "name": name,
                "region": region,
                "displayName": display_name,
                "center": [latitude, longitude],
                "bounds": [west, south, east, north],
            }
        )
    if entries and not places:
        raise ValueError("The place search provider returned no usable locations.")
    return places


def _configured_search_url(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    parsed = urlparse(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
    ):
        return None
    return f"{value.rstrip('/')}/search"


async def geocode_places(request: Any, env: Any) -> Any:
    from js import AbortSignal, Request as JSRequest  # type: ignore[reportMissingModuleSource]
    from workers import Response, fetch
    from runtime import to_js_object

    query = normalize_place_query(parse_qs(urlparse(str(request.url)).query).get("q", [""])[0])
    if query is None:
        return Response.from_json(
            {"error": f"Enter a place name between 2 and {MAX_QUERY_LENGTH} characters."},
            status=400,
        )

    search_url = _configured_search_url(
        getattr(env, "GEOCODER_BASE_URL", DEFAULT_GEOCODER_URL)
    )
    if search_url is None:
        return Response.from_json(
            {"error": "The configured place-search provider URL is invalid."},
            status=503,
        )

    cache_key = "place-search:v1:" + hashlib.sha256(
        f"{search_url}|{query.casefold()}".encode()
    ).hexdigest()
    try:
        cached = await env.CACHE.get(cache_key)
        if cached:
            return Response.from_json(json.loads(cached), headers={"X-Cache": "HIT"})
    except Exception as error:
        print(f"Place search cache read failed: {error}")

    try:
        rate_result = await env.DB.prepare(RATE_LIMIT_SQL).run()
        if int(rate_result.meta.changes or 0) == 0:
            return Response.from_json(
                {"error": "Place search is busy. Wait a second, then try again."},
                status=429,
                headers={"Retry-After": "1"},
            )
    except Exception as error:
        print(f"Place search rate limiter failed: {error}")
        return Response.from_json(
            {"error": "Place search is temporarily unavailable."},
            status=503,
        )

    url = f"{search_url}?{urlencode({'q': query, 'format': 'jsonv2', 'limit': '5', 'addressdetails': '1'})}"
    try:
        fetch_request = JSRequest.new(
            url,
            to_js_object(
                {
                    "headers": {
                        "Accept": "application/json",
                        "User-Agent": USER_AGENT,
                    },
                    "redirect": "manual",
                    "signal": AbortSignal.timeout(10_000),
                }
            ),
        )
        response = await fetch(fetch_request)
    except Exception as error:
        print(f"Place search provider request failed: {error}")
        return Response.from_json(
            {"error": "The place search provider could not be reached. Try again shortly."},
            status=502,
        )
    if 300 <= response.status < 400:
        print(f"Place search provider redirected the request to HTTP {response.status}")
        return Response.from_json(
            {"error": "The place search provider redirected the request instead of returning results."},
            status=502,
        )
    if not response.ok:
        print(f"Place search provider returned HTTP {response.status}")
        return Response.from_json(
            {"error": f"The place search provider returned HTTP {response.status}."},
            status=502,
        )
    try:
        places = parse_nominatim_results(json.loads(await response.text()))
    except (TypeError, ValueError) as error:
        print(f"Place search provider returned unreadable metadata: {error}")
        return Response.from_json(
            {"error": "The place search provider returned unexpected results."},
            status=502,
        )

    payload = {"places": places}
    try:
        await env.CACHE.put(
            cache_key,
            json.dumps(payload),
            {"expirationTtl": GEOCODE_CACHE_TTL_SECONDS},
        )
    except Exception as error:
        print(f"Place search cache write failed: {error}")
    return Response.from_json(payload, headers={"X-Cache": "MISS"})
