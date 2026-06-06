/**
 * Summit Health — partner storefront server
 *
 * Serves a standalone marketing site and /api/* routes (production pattern: no key in browser).
 *
 * Modes:
 *   Mock (default) — implements Partner API v1 locally for UI testing without Supabase deploy
 *   Live — set PARTNER_API_KEY to proxy to Supabase Edge Function
 *
 *   npm run partner-storefront
 *   $env:PARTNER_API_KEY="pk_…"; $env:PARTNER_API_LIVE="1"; npm run partner-storefront
 */

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5200);
const LIVE = process.env.PARTNER_API_LIVE === "1" || process.env.PARTNER_API_LIVE === "true";
const API_BASE =
  process.env.PARTNER_API_URL ||
  "https://vzzmdbdvcofajgrjgajq.supabase.co/functions/v1/partner-api";
const KEY = process.env.PARTNER_API_KEY || "";
const BRAND = process.env.PARTNER_BRAND_SLUG || "summit-md";
const PORTAL_ORIGIN = process.env.PARTNER_PORTAL_ORIGIN || "https://www.peak-health.io";

const API_VERSION = "1.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

const MOCK_BRANDS = {
  "summit-md": {
    id: "7caaa526-185e-4eda-bf0e-832be6ba37a7",
    name: "Summit MD",
    slug: "summit-md",
    domain: "summitmd.com",
    status: "active",
    portal_origin: PORTAL_ORIGIN,
  },
  "north-star-md": {
    id: "c8e7f6a2-4b1d-4e9f-a3c2-1d5e8f7a6b4c",
    name: "North Star MD",
    slug: "north-star-md",
    domain: "northstarmd.com",
    status: "active",
    portal_origin: "https://joinnorthstarmd.com",
  },
};

const MOCK_PRODUCTS = [
  {
    id: "prod-weight-loss",
    name: "Medical Weight Loss",
    category: "weight-loss",
    tagline: "Physician-guided GLP-1 program",
    price_usd: 199,
    active: true,
  },
  {
    id: "prod-ed",
    name: "Men's Sexual Health",
    category: "sexual-wellness",
    tagline: "Discreet telehealth consult",
    price_usd: 89,
    active: true,
  },
  {
    id: "prod-hair",
    name: "Hair Restoration",
    category: "hair-loss",
    tagline: "FDA-approved treatments",
    price_usd: 79,
    active: true,
  },
];

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

function mockPortalUrls(brand, opts = {}) {
  const base = (opts.portalOrigin || brand.portal_origin || "https://www.peak-health.io").replace(/\/$/, "");
  const params = new URLSearchParams({ brand: brand.slug, brandId: brand.id });
  if (opts.category) params.set("category", opts.category);
  if (opts.productId) params.set("product", opts.productId);
  if (opts.returnUrl) params.set("partner_return_url", opts.returnUrl);
  const q = params.toString();
  const care = `${base}/care/${brand.slug}`;
  return {
    enrollment_url: `${care}/shop?${q}`,
    patient_portal_url: `${care}/patient`,
    patient_login_url: `${care}/login`,
    brand_admin_url: `${care}/admin/login`,
    affiliate_portal_url: `${care}/affiliate/login`,
    provider_portal_url: `${base}/providers/login`,
  };
}

function mockDocs() {
  const liveBase = API_BASE;
  return {
    service: "partner-api",
    version: API_VERSION,
    mode: LIVE && KEY ? "live-proxy" : "local-mock",
    documentation: "docs/PARTNER_API.md",
    base_url: LIVE && KEY ? liveBase : `http://localhost:${PORT}/api`,
    docs_ui_url: `${liveBase}?action=docs_ui`,
    openapi_url: `${liveBase}?action=openapi`,
    authentication: {
      header: "X-Partner-Api-Key",
      note: "This demo store calls /api on the partner server only.",
    },
    endpoints: [
      { method: "GET", action: "health", auth: false },
      { method: "GET", action: "docs", auth: false },
      { method: "GET", action: "docs_ui", auth: false },
      { method: "GET", action: "openapi", auth: false },
      { method: "GET", action: "brand", auth: true, query: ["brand_slug"] },
      { method: "GET", action: "catalog", auth: true, query: ["brand_slug"] },
      { method: "POST", action: "enrollment_start", auth: true },
    ],
    quick_start: [
      `Interactive docs: ${liveBase}?action=docs_ui`,
      `Postman import: ${liveBase}?action=openapi`,
    ],
  };
}

function handleMock(action, method, body, searchParams) {
  if (action === "health" && method === "GET") {
    return {
      status: 200,
      body: {
        ok: true,
        service: "partner-api",
        version: API_VERSION,
        auth_configured: true,
        mode: "local-mock",
      },
    };
  }
  if (action === "docs" && method === "GET") {
    return { status: 200, body: mockDocs() };
  }
  if (action === "config" && method === "GET") {
    return {
      status: 200,
      body: {
        mode: "local-mock",
        brand_slug: BRAND,
        portal_origin: PORTAL_ORIGIN,
        live_available: Boolean(KEY),
      },
    };
  }

  const brandSlug = (searchParams.get("brand_slug") || body?.brand_slug || BRAND).trim().toLowerCase();
  const brand = MOCK_BRANDS[brandSlug];
  if (!brand) {
    return { status: 404, body: { error: "Brand not found" } };
  }

  if ((action === "brand" || action === "portals") && method === "GET") {
    return {
      status: 200,
      body: { brand, portals: mockPortalUrls(brand) },
    };
  }

  if (action === "catalog" && method === "GET") {
    const urls = mockPortalUrls(brand);
    const products = MOCK_PRODUCTS.map((p) => ({
      ...p,
      enrollment_url: mockPortalUrls(brand, {
        category: p.category,
        productId: p.id,
      }).enrollment_url,
    }));
    return {
      status: 200,
      body: {
        brand: { id: brand.id, slug: brand.slug, name: brand.name },
        products,
        portals: urls,
      },
    };
  }

  if (action === "enrollment_start" && method === "POST") {
    const portals = mockPortalUrls(brand, {
      category: body?.category,
      portalOrigin: body?.portal_origin,
      returnUrl: body?.return_url,
      productId: body?.product_id,
    });
    return {
      status: 200,
      body: {
        session_id: randomUUID(),
        brand: { id: brand.id, slug: brand.slug, name: brand.name },
        ...portals,
        next_step: "redirect",
        message: "Send the patient to enrollment_url (mock — same shape as live Partner API).",
      },
    };
  }

  return { status: 400, body: { error: "Unknown action", hint: "GET ?action=docs" } };
}

async function proxyLive(path, method, body) {
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
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return { status: res.status, body: parsed };
}

async function handleApi(req, res, pathname, searchParams) {
  const segments = pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const action = segments[0] || searchParams.get("action") || "health";

  let body = null;
  if (req.method === "POST") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    body = raw ? JSON.parse(raw) : {};
  }

  if (LIVE && KEY) {
    if (action === "config") {
      return json(res, 200, { mode: "live-proxy", brand_slug: BRAND, portal_origin: PORTAL_ORIGIN });
    }
    if (action === "health") {
      const { status, body: b } = await proxyLive("?action=health", "GET");
      return json(res, status, { ...b, mode: "live-proxy" });
    }
    if (action === "docs") {
      const { status, body: b } = await proxyLive("?action=docs", "GET");
      return json(res, status, b);
    }
    if (action === "brand") {
      const { status, body: b } = await proxyLive(
        `?action=brand&brand_slug=${encodeURIComponent(BRAND)}`,
        "GET",
      );
      return json(res, status, b);
    }
    if (action === "catalog") {
      const { status, body: b } = await proxyLive(
        `?action=catalog&brand_slug=${encodeURIComponent(BRAND)}`,
        "GET",
      );
      return json(res, status, b);
    }
    if (action === "enrollment_start" && req.method === "POST") {
      const upstream = await fetch(API_BASE, {
        method: "POST",
        headers: { "X-Partner-Api-Key": KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enrollment_start",
          brand_slug: BRAND,
          portal_origin: body?.portal_origin || PORTAL_ORIGIN,
          ...body,
        }),
      });
      const text = await upstream.text();
      return json(res, upstream.status, JSON.parse(text));
    }
    return json(res, 404, { error: "Unknown API route" });
  }

  const result = handleMock(action, req.method, body, searchParams);
  return json(res, result.status, result.body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (url.pathname.startsWith("/api")) {
    try {
      await handleApi(req, res, url.pathname, url.searchParams);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "Server error" });
    }
    return;
  }

  let filePath = join(__dirname, url.pathname === "/" ? "index.html" : url.pathname.slice(1));
  if (!existsSync(filePath) || !filePath.startsWith(__dirname)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "text/plain" });
  res.end(readFileSync(filePath));
});

server.listen(PORT, () => {
  console.log("");
  console.log("  Summit Health partner storefront");
  console.log(`  → http://localhost:${PORT}`);
  console.log("");
  console.log(LIVE && KEY ? "  Mode: LIVE (proxying to Supabase partner-api)" : "  Mode: MOCK (local Partner API v1 — no deploy needed)");
  if (!LIVE || !KEY) {
    console.log("  Live:  $env:PARTNER_API_KEY='…'; $env:PARTNER_API_LIVE='1'; npm run partner-storefront");
  }
  console.log("");
});
