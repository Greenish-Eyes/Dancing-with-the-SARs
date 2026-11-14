from urllib.parse import urlparse

from workers import Response, WorkerEntrypoint

from browse import get_browse_image
from explain import explain_change
from geocode import geocode_places
from nisar import ingest_all_sites, list_nisar_granules, pass_feed


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        path = urlparse(str(request.url)).path
        if path == "/api/nisar/granules" and request.method == "GET":
            return await list_nisar_granules(request, self.env)
        if path == "/api/nisar/geocode" and request.method == "GET":
            return await geocode_places(request, self.env)
        if path == "/api/nisar/feed" and request.method == "GET":
            return await pass_feed(request, self.env)
        if path == "/api/nisar/browse" and request.method == "GET":
            return await get_browse_image(request, self.env)
        if path == "/api/nisar/explain" and request.method == "POST":
            return await explain_change(request, self.env)
        if path.startswith("/api/"):
            return Response.from_json({"error": "API route not found."}, status=404)
        return await self.env.ASSETS.fetch(request)

    async def scheduled(self, _controller, env, _ctx):
        await ingest_all_sites(env)
