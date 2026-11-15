from typing import Any

from gemini import gemini_insight


async def explain_change(request: Any, env: Any) -> Any:
    return await gemini_insight(request, env, forced_mode="explain")
