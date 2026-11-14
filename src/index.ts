import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";
import { listNisarGranules } from "./nisar";

const app = new Hono<{ Bindings: Env }>();

const openapi = fromHono(app, {
	docs_url: "/docs",
});

openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);

app.get("/api/nisar/granules", listNisarGranules);

export default app;
