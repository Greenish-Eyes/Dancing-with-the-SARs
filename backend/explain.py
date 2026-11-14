import base64
import json
import re
from datetime import datetime

from .browse import fetch_browse_image, image_bytes
from .runtime import to_js_object

MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct"
EXPLAIN_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60
MAX_IMAGE_BYTES = 3 * 1024 * 1024
SCENE_ID = re.compile(r"^[A-Za-z0-9_.-]{1,80}$")


def _valid_scene(scene: object) -> bool:
    if not isinstance(scene, dict):
        return False
    if not isinstance(scene.get("id"), str) or not SCENE_ID.fullmatch(scene["id"]):
        return False
    try:
        datetime.strptime(scene.get("date", ""), "%Y-%m-%d")
    except (TypeError, ValueError):
        return False
    return isinstance(scene.get("imageUrl"), str)


def _prompt(data: dict) -> str:
    theme = data.get("theme")
    return "\n".join(
        [
            "You are helping a student read two NISAR L-band radar browse images (quicklooks).",
            f"Place: {data['place']}." + (f" Context: {theme}." if theme else ""),
            f"Image 1 is the EARLIER pass ({data['before']['date']}). Image 2 is the LATER pass ({data['after']['date']}). Layer: {data['layer']}.",
            "Bright pixels mean strong radar backscatter (rough, structured, or very wet surfaces, buildings, tree trunks); dark pixels mean weak backscatter (smooth surfaces such as calm open water).",
            "These are provisional, uncalibrated browse images, so differences can also come from viewing geometry, soil moisture, or processing, not only real change.",
            "Write under 130 words in plain language, in exactly three short parts labeled:",
            "What differs: visible differences between the two images, or say there is no obvious difference.",
            "Possible drivers: one or two physical hypotheses worded as possibilities (for example flooding, vegetation or soil moisture, ice or snow, land movement).",
            "Caveat: one sentence on why this is not a measurement.",
            "Do not invent numbers or place names you cannot see.",
        ]
    )


async def explain_change(request: object, env: object) -> object:
    from workers import Response

    try:
        data = json.loads(await request.text())
    except (TypeError, ValueError):
        return Response.json({"error": "Send a JSON body."}, status=400)
    if not isinstance(data, dict):
        return Response.json(
            {"error": "Provide a place and two passes with browse images."},
            status=400,
        )
    theme = data.get("theme", "")
    layer = data.get("layer", "Geographic quicklook")
    if (
        not isinstance(data.get("place"), str)
        or not 1 <= len(data["place"]) <= 120
        or not isinstance(theme, str)
        or len(theme) > 200
        or not isinstance(layer, str)
        or len(layer) > 60
        or not _valid_scene(data.get("before"))
        or not _valid_scene(data.get("after"))
    ):
        return Response.json(
            {"error": "Provide a place and two passes with browse images."},
            status=400,
        )
    data.setdefault("layer", "Geographic quicklook")
    cache_key = f"explain:v1:{data['before']['id']}:{data['after']['id']}:{data['layer']}"
    try:
        cached = await env.CACHE.get(cache_key)
        if cached:
            return Response.json({**json.loads(cached), "cached": True})
    except Exception as error:
        print(f"Explanation cache read failed: {error}")
    if not getattr(env, "AI", None):
        return Response.json({"error": "The AI binding is not configured."}, status=503)

    try:
        before_type, before_buffer = await fetch_browse_image(
            data["before"]["imageUrl"], MAX_IMAGE_BYTES
        )
        after_type, after_buffer = await fetch_browse_image(
            data["after"]["imageUrl"], MAX_IMAGE_BYTES
        )
        before_image = "data:" + before_type + ";base64," + base64.b64encode(
            image_bytes(before_buffer)
        ).decode("ascii")
        after_image = "data:" + after_type + ";base64," + base64.b64encode(
            image_bytes(after_buffer)
        ).decode("ascii")
    except Exception as error:
        print(f"Browse image fetch failed for AI: {error}")
        return Response.json(
            {"error": "Could not load the browse images for analysis."},
            status=502,
        )

    try:
        result = await env.AI.run(
            MODEL,
            to_js_object(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": _prompt(data)},
                                {"type": "image_url", "image_url": {"url": before_image}},
                                {"type": "image_url", "image_url": {"url": after_image}},
                            ],
                        }
                    ],
                    "max_tokens": 350,
                }
            ),
        )
        text = str(getattr(result, "response", result)).strip()
    except Exception as error:
        print(f"Workers AI request failed: {error}")
        return Response.json(
            {"error": "The AI reader is unavailable right now. Try again shortly."},
            status=502,
        )
    if not text:
        return Response.json({"error": "The AI reader returned no text."}, status=502)

    payload = {"text": text, "model": MODEL}
    try:
        await env.CACHE.put(
            cache_key,
            json.dumps(payload),
            to_js_object({"expirationTtl": EXPLAIN_CACHE_TTL_SECONDS}),
        )
    except Exception as error:
        print(f"Explanation cache write failed: {error}")
    return Response.json({**payload, "cached": False})
