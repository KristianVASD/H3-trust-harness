import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  CollectionNameSchema,
  type CollectionName,
  type Mission,
} from "@h3-trust/schema";
import { FileStore } from "@h3-trust/store";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const writableRoot = path.resolve(__dirname, "../../../writable");
const store = new FileStore(writableRoot);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);

app.get("/api/health", (c) =>
  c.json({ ok: true, service: "h3-trust-harness", writableRoot }),
);

app.get("/api/missions", async (c) => {
  const missions = await store.listMissions();
  return c.json(missions);
});

app.get("/api/missions/:id", async (c) => {
  const mission = await store.getMission(c.req.param("id"));
  if (!mission) return c.json({ error: "Not found" }, 404);
  return c.json(mission);
});

app.post("/api/missions", async (c) => {
  const body = await c.req.json();
  const mission = await store.upsertMission(body as Mission);
  return c.json(mission, 201);
});

app.put("/api/missions/:id", async (c) => {
  const body = await c.req.json();
  if (body.id !== c.req.param("id")) {
    return c.json({ error: "ID mismatch" }, 400);
  }
  const mission = await store.upsertMission(body as Mission);
  return c.json(mission);
});

app.delete("/api/missions/:id", async (c) => {
  const ok = await store.deleteMission(c.req.param("id"));
  if (!ok) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

const missionCollections = CollectionNameSchema.options.filter(
  (name) => name !== "missions" && name !== "patterns",
) as Exclude<CollectionName, "missions" | "patterns">[];

for (const collection of missionCollections) {
  app.get(`/api/missions/:missionId/${collection}`, async (c) => {
    const items = await store.listByMission(collection, c.req.param("missionId"));
    return c.json(items);
  });

  app.post(`/api/missions/:missionId/${collection}`, async (c) => {
    const body = await c.req.json();
    if (body.missionId !== c.req.param("missionId")) {
      return c.json({ error: "missionId mismatch" }, 400);
    }
    const saved = await store.upsert(collection, body);
    return c.json(saved, 201);
  });

  app.put(`/api/${collection}/:id`, async (c) => {
    const body = await c.req.json();
    if (body.id !== c.req.param("id")) {
      return c.json({ error: "ID mismatch" }, 400);
    }
    const saved = await store.upsert(collection, body);
    return c.json(saved);
  });

  app.delete(`/api/${collection}/:id`, async (c) => {
    const ok = await store.remove(collection, c.req.param("id"));
    return c.json({ ok });
  });
}

app.get("/api/patterns", async (c) => {
  return c.json(await store.listPatterns());
});

app.post("/api/patterns", async (c) => {
  const body = await c.req.json();
  const saved = await store.upsert("patterns", body);
  return c.json(saved, 201);
});

app.get("/api/missions/:id/export", async (c) => {
  try {
    const bundle = await store.exportBundle(c.req.param("id"));
    const exportDir = path.join(writableRoot, "export");
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(exportDir, { recursive: true });
    const outPath = path.join(exportDir, `${c.req.param("id")}.json`);
    await writeFile(outPath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
    return c.json(bundle);
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      404,
    );
  }
});

const port = Number(process.env.PORT ?? 8787);

console.log(`H3 Trust API listening on http://localhost:${port}`);
console.log(`Writable root: ${writableRoot}`);

serve({ fetch: app.fetch, port });
