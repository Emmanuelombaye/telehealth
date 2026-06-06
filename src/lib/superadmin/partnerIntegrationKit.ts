import { partnerApiBaseUrl } from "./partnerApi";

export type PartnerIntegrationKit = {
  brandName: string;
  brandSlug: string;
  brandId: string;
  apiBase: string;
  portalOrigin: string | null;
  apiKeyPlaceholder: string;
  steps: { title: string; body: string }[];
  envFile: string;
  vercelApiRoute: string;
  nextApiRoute: string;
  frontendButton: string;
  curlHealth: string;
  curlEnroll: string;
  markdown: string;
};

export function buildPartnerIntegrationKit(opts: {
  brandName: string;
  brandSlug: string;
  brandId: string;
  portalOrigin?: string | null;
  apiKey?: string;
  returnUrl?: string | null;
}): PartnerIntegrationKit {
  const apiBase = partnerApiBaseUrl();
  const slug = opts.brandSlug.trim();
  const keyLine = opts.apiKey ?? "PASTE_YOUR_API_KEY_HERE";
  const keyPlaceholder = opts.apiKey ? opts.apiKey : "YOUR_PARTNER_API_KEY";
  const portalOrigin = opts.portalOrigin?.trim() || null;
  const returnUrl = opts.returnUrl?.trim() || (portalOrigin ? `${portalOrigin.replace(/\/$/, "")}/thank-you` : null);

  const envFile = `# Summit / partner server env (Vercel → Settings → Environment Variables)
# Never prefix with NEXT_PUBLIC_ — key must stay server-side only.

PARTNER_API_KEY=${keyLine}
PARTNER_BRAND_SLUG=${slug}
PARTNER_API_URL=${apiBase}
${portalOrigin ? `PARTNER_PORTAL_ORIGIN=${portalOrigin}` : ""}`.trim();

  const vercelApiRoute = `// api/enroll-start.js — Vercel serverless (Node)
// Your marketing site calls POST /api/enroll-start (never call Peak directly from the browser).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.PARTNER_API_KEY;
  const brandSlug = process.env.PARTNER_BRAND_SLUG || "${slug}";
  const apiBase =
    process.env.PARTNER_API_URL ||
    "${apiBase}";

  if (!apiKey) {
    return res.status(500).json({ error: "PARTNER_API_KEY not configured" });
  }

  const { product_id, category } = req.body || {};

  const upstream = await fetch(apiBase, {
    method: "POST",
    headers: {
      "X-Partner-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "enrollment_start",
      brand_slug: brandSlug,
      product_id: product_id || undefined,
      category: category || undefined,
      ${portalOrigin ? `portal_origin: process.env.PARTNER_PORTAL_ORIGIN || "${portalOrigin}",` : ""}
      ${returnUrl ? `return_url: "${returnUrl}",` : ""}
    }),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return res.status(upstream.status).json(data);
  }

  return res.status(200).json(data);
}`;

  const nextApiRoute = `// app/api/enroll-start/route.ts — Next.js App Router
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.PARTNER_API_KEY;
  const brandSlug = process.env.PARTNER_BRAND_SLUG || "${slug}";
  const apiBase = process.env.PARTNER_API_URL || "${apiBase}";

  if (!apiKey) {
    return NextResponse.json({ error: "PARTNER_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { product_id, category } = body as { product_id?: string; category?: string };

  const upstream = await fetch(apiBase, {
    method: "POST",
    headers: {
      "X-Partner-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "enrollment_start",
      brand_slug: brandSlug,
      product_id,
      category,
      ${portalOrigin ? `portal_origin: process.env.PARTNER_PORTAL_ORIGIN || "${portalOrigin}",` : ""}
      ${returnUrl ? `return_url: "${returnUrl}",` : ""}
    }),
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}`;

  const frontendButton = `// Your product card — calls YOUR backend only (keeps API key secret)
async function onGetStarted(productId, category) {
  const res = await fetch("/api/enroll-start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,   // Peak clinical product UUID (we send you the mapping)
      category: category,      // e.g. weight-loss
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || data.hint || "Could not start enrollment");
    return;
  }

  // Hand off to Peak checkout / intake
  window.location.href = data.enrollment_url;
}

// Optional: you keep your own product UI — no need to use GET catalog`;

  const curlHealth = `curl "${apiBase}?action=health"`;

  const curlEnroll = `curl -X POST "${apiBase}" \\
  -H "X-Partner-Api-Key: ${keyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"enrollment_start","brand_slug":"${slug}"${portalOrigin ? `,"portal_origin":"${portalOrigin}"` : ""}}'`;

  const steps = [
    {
      title: "1. Add env vars on your server",
      body: "Copy PARTNER_API_KEY and PARTNER_BRAND_SLUG into Vercel/hosting (server only). Never put the key in frontend code.",
    },
    {
      title: "2. Add one API route",
      body: "Paste the Vercel or Next.js handler below as /api/enroll-start. It proxies to Peak Partner API.",
    },
    {
      title: "3. Wire your Get started button",
      body: "On each product card, POST to /api/enroll-start then redirect to enrollment_url. Keep your own product pages.",
    },
  ];

  const markdown = `# ${opts.brandName} — Partner API connect (5 minutes)

You keep your website and products. Peak handles checkout, intake, and patient care.

## Credentials

| Item | Value |
|------|--------|
| brand_slug | \`${slug}\` |
| brand_id | \`${opts.brandId}\` |
| API base | \`${apiBase}\` |
| Auth header | \`X-Partner-Api-Key\` |
${opts.apiKey ? `| API key | \`${opts.apiKey}\` *(share once, server only)* |` : "| API key | *(Peak sends separately)* |"}

## 3 steps

${steps.map((s) => `### ${s.title}\n${s.body}`).join("\n\n")}

## Environment (.env)

\`\`\`
${envFile}
\`\`\`

## Server route (Vercel)

\`\`\`javascript
${vercelApiRoute}
\`\`\`

## Frontend button

\`\`\`javascript
${frontendButton}
\`\`\`

## Test with curl

\`\`\`bash
${curlHealth}

${curlEnroll}
\`\`\`

## Product mapping

Use **your** product cards. Send Peak's \`product_id\` UUID per treatment when you call enroll (we provide the mapping table).

Optional: \`GET ?action=catalog&brand_slug=${slug}\` — only if you want to sync from Peak instead of your own catalog.

## Full reference

See \`docs/PARTNER_API.md\` for all endpoints and errors.
`;

  return {
    brandName: opts.brandName,
    brandSlug: slug,
    brandId: opts.brandId,
    apiBase,
    portalOrigin,
    apiKeyPlaceholder: keyPlaceholder,
    steps,
    envFile,
    vercelApiRoute,
    nextApiRoute,
    frontendButton,
    curlHealth,
    curlEnroll,
    markdown,
  };
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
