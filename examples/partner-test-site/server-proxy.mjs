/**
 * Production pattern: partner backend proxies API calls so the key never hits the browser.
 *
 * Usage:
 *   PARTNER_API_KEY=xxx node server-proxy.mjs
 *   Open http://localhost:5198 — frontend calls /api/* on this server only.
 */

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5198);
const API_BASE =
  process.env.PARTNER_API_URL ||
  "https://kvopgyhcjcniaocjozje.supabase.co/functions/v1/partner-api";
const KEY = process.env.PARTNER_API_KEY || "";
const BRAND = process.env.PARTNER_BRAND_SLUG || "summit-md";

if (!KEY) {
  console.error("Set PARTNER_API_KEY in the environment.");
  process.exit(1);
}

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
};

async function forwardPartnerApi(path, method, body) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("?") ? path : "?" + path.replace(/^\?/, "")}`;
  const res = await fetch(url, {
    method,
    headers: {
      "X-Partner-Api-Key": KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, text };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (url.pathname.startsWith("/api/")) {
    const action = url.pathname.replace("/api/", "");
    if (action === "catalog") {
      const { status, text } = await forwardPartnerApi(
        `?action=catalog&brand_slug=${encodeURIComponent(BRAND)}`,
        "GET",
      );
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(text);
      return;
    }
    if (action === "brand") {
      const { status, text } = await forwardPartnerApi(
        `?action=brand&brand_slug=${encodeURIComponent(BRAND)}`,
        "GET",
      );
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(text);
      return;
    }
    if (action === "docs") {
      const res2 = await fetch(`${API_BASE}?action=docs`);
      const text = await res2.text();
      res.writeHead(res2.status, { "Content-Type": "application/json" });
      res.end(text);
      return;
    }
    if (action === "health") {
      const res2 = await fetch(`${API_BASE}?action=health`);
      const text = await res2.text();
      res.writeHead(res2.status, { "Content-Type": "application/json" });
      res.end(text);
      return;
    }
    if (action === "enrollment_start" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const parsed = body ? JSON.parse(body) : {};
      const upstream = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "X-Partner-Api-Key": KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "enrollment_start",
          brand_slug: BRAND,
          ...parsed,
        }),
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, { "Content-Type": "application/json" });
      res.end(text);
      return;
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Unknown API route" }));
    return;
  }

  let filePath = join(__dirname, url.pathname === "/" ? "index-proxy.html" : url.pathname.slice(1));
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
  res.end(readFileSync(filePath));
});

server.listen(PORT, () => {
  console.log(`Partner demo (server proxy) http://localhost:${PORT}`);
  console.log("API key stays on server — safe production pattern.");
});
