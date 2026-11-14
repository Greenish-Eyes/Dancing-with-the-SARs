import hashlib
from typing import Any
from urllib.parse import parse_qs, urljoin, urlparse

from runtime import to_js_object

MAX_URL_LENGTH = 2_048
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_REDIRECTS = 3
CACHE_CONTROL = "public, max-age=86400, s-maxage=604800"
ALLOWED_HOST_SUFFIXES = (
    "asf.alaska.edu",
    "earthdatacloud.nasa.gov",
    "earthdata.nasa.gov",
)
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
NISAR_CDN_PATH = (
    "/sds-n-cumulus-prod-nisar-browse.s3.us-west-2.amazonaws.com/"
    "nisar_l2_gcov_provisional_v1/"
)


def parse_browse_url(value: str) -> str | None:
    if len(value) > MAX_URL_LENGTH:
        return None
    try:
        parsed = urlparse(value)
        hostname = (parsed.hostname or "").lower()
        nasa_host = any(
            hostname == suffix or hostname.endswith(f".{suffix}")
            for suffix in ALLOWED_HOST_SUFFIXES
        )
        cdn_host = (
            hostname.endswith(".cloudfront.net")
            and NISAR_CDN_PATH in parsed.path.lower()
        )
        if (
            parsed.scheme != "https"
            or parsed.username
            or parsed.password
            or parsed.port
            or (not nasa_host and not cdn_host)
            or "nisar" not in parsed.path.lower()
            or not parsed.path.lower().endswith(".png")
        ):
            return None
    except ValueError:
        return None
    return parsed.geturl()


async def fetch_browse_image(value: str, max_bytes: int = MAX_IMAGE_BYTES) -> tuple[str, object]:
    from js import AbortSignal, Request as JSRequest, Uint8Array  # type: ignore[reportMissingModuleSource]
    from workers import fetch

    url = parse_browse_url(value)
    if not url:
        raise ValueError("Browse images must be PNG files hosted by NASA or ASF.")

    for redirect_count in range(MAX_REDIRECTS + 1):
        fetch_request = JSRequest.new(
            url,
            to_js_object(
                {
                    "headers": {"Accept": "image/png"},
                    "redirect": "manual",
                    "signal": AbortSignal.timeout(10_000),
                }
            ),
        )
        response = await fetch(fetch_request)
        if 300 <= response.status < 400:
            location = response.headers.get("Location")
            redirected_url = parse_browse_url(urljoin(url, location)) if location else None
            if not redirected_url or redirect_count == MAX_REDIRECTS:
                raise ValueError("The browse image redirected to an unsupported address.")
            url = redirected_url
            continue
        if not response.ok:
            raise ValueError(f"The browse image source returned HTTP {response.status}.")

        content_type = (response.headers.get("Content-Type") or "").split(";")[0].lower()
        if content_type not in ("image/png", "application/octet-stream", "binary/octet-stream"):
            raise ValueError("The browse image source did not return a PNG image.")
        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) > max_bytes:
            raise ValueError("The browse image exceeds the size limit.")
        image_buffer = await response.buffer()
        image_view = Uint8Array.new(image_buffer)
        if image_view.length > max_bytes:
            raise ValueError("The browse image exceeds the size limit.")
        signature = bytes(int(image_view[index]) for index in range(len(PNG_SIGNATURE)))
        if signature != PNG_SIGNATURE:
            raise ValueError("The browse image source did not contain a valid PNG image.")
        return "image/png", image_buffer

    raise ValueError("The browse image exceeded the redirect limit.")


def image_bytes(image_buffer: object) -> bytes:
    from js import Uint8Array  # type: ignore[reportMissingModuleSource]

    view = Uint8Array.new(image_buffer)
    return bytes(int(view[index]) for index in range(view.length))


async def get_browse_image(request: Any, env: Any) -> Any:
    from workers import Response

    query = parse_qs(urlparse(str(request.url)).query)
    url = parse_browse_url(query.get("url", [""])[0])
    if not url:
        return Response.from_json(
            {"error": "Provide a valid NISAR PNG browse-image URL from NASA or ASF."},
            status=400,
        )
    key = f"browse/v1/{hashlib.sha256(url.encode()).hexdigest()}"
    try:
        cached = await env.IMAGES.get(key)
        if cached:
            return Response(
                cached.body,
                headers={
                    "Cache-Control": CACHE_CONTROL,
                    "Content-Type": "image/png",
                    "X-Content-Type-Options": "nosniff",
                    "X-Image-Cache": "HIT",
                    "ETag": cached.httpEtag,
                },
            )
    except Exception as error:
        print(f"NISAR browse cache read failed: {error}")

    try:
        content_type, image_buffer = await fetch_browse_image(url)
    except (ValueError, TypeError) as error:
        return Response.from_json({"error": str(error)}, status=502)
    except Exception as error:
        print(f"NISAR browse request failed: {error}")
        return Response.from_json(
            {"error": "The browse image could not be loaded."}, status=502
        )

    headers = {
        "Cache-Control": CACHE_CONTROL,
        "Content-Type": content_type,
        "X-Content-Type-Options": "nosniff",
    }
    try:
        await env.IMAGES.put(
            key,
            image_buffer,
            to_js_object(
                {
                    "httpMetadata": {
                        "cacheControl": CACHE_CONTROL,
                        "contentType": content_type,
                    }
                }
            ),
        )
        headers["X-Image-Cache"] = "MISS"
    except Exception as error:
        print(f"NISAR browse cache write failed: {error}")
        headers["X-Image-Cache"] = "BYPASS"
    return Response(image_buffer, headers=headers)
