/** OpenAPI 3.0 + browsable docs for Partner API v1 */

export const PARTNER_API_VERSION = "1.0.0";

export function partnerApiOpenApiSpec(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "");
  return {
    openapi: "3.0.3",
    info: {
      title: "Peak Health Partner API",
      version: PARTNER_API_VERSION,
      description:
        "Private integration API for white-label partners. Call from your **backend** only — never expose `X-Partner-Api-Key` in public JavaScript.\n\n" +
        "**Flow:** `GET catalog` → user clicks enroll → `POST enrollment_start` → redirect browser to `enrollment_url`.\n\n" +
        "Interactive docs: `" + base + "?action=docs_ui`",
      contact: { name: "Peak Health integrations" },
    },
    servers: [{ url: base, description: "Partner API (Supabase Edge Function)" }],
    tags: [
      { name: "Meta", description: "Health and documentation" },
      { name: "Brand", description: "Brand metadata and portal URLs" },
      { name: "Catalog", description: "Products for partner storefront" },
      { name: "Enrollment", description: "Hand off patient to branded shop" },
    ],
    paths: {
      "/?action=health": {
        get: {
          tags: ["Meta"],
          summary: "Health check",
          operationId: "health",
          security: [],
          responses: {
            "200": {
              description: "Service is up",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/?action=docs": {
        get: {
          tags: ["Meta"],
          summary: "Machine-readable docs index",
          operationId: "docs",
          security: [],
          responses: {
            "200": {
              description: "Endpoint index and integration flow",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/?action=openapi": {
        get: {
          tags: ["Meta"],
          summary: "OpenAPI 3.0 spec (import into Postman / Insomnia)",
          operationId: "openapi",
          security: [],
          responses: {
            "200": {
              description: "OpenAPI document",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/?action=brand": {
        get: {
          tags: ["Brand"],
          summary: "Brand metadata + portal URLs",
          operationId: "brand",
          parameters: [{ $ref: "#/components/parameters/brand_slug" }],
          responses: {
            "200": {
              description: "Brand and portal links",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/BrandPortalsResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/?action=portals": {
        get: {
          tags: ["Brand"],
          summary: "Portal URLs (alias for brand)",
          operationId: "portals",
          parameters: [{ $ref: "#/components/parameters/brand_slug" }],
          responses: {
            "200": {
              description: "Same as brand",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/BrandPortalsResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/?action=connect": {
        get: {
          tags: ["Meta"],
          summary: "Brand-specific connect guide (steps, curl, env)",
          operationId: "connect",
          parameters: [{ $ref: "#/components/parameters/brand_slug" }],
          responses: {
            "200": {
              description: "Integration steps and examples for this brand",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/?action=catalog": {
        get: {
          tags: ["Catalog"],
          summary: "Active product catalog (optional if partner uses own products)",
          operationId: "catalog",
          parameters: [{ $ref: "#/components/parameters/brand_slug" }],
          responses: {
            "200": {
              description: "Products with per-item enrollment_url",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CatalogResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/": {
        post: {
          tags: ["Enrollment"],
          summary: "Start enrollment (redirect handoff)",
          operationId: "enrollment_start",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EnrollmentStartRequest" },
                examples: {
                  default: {
                    summary: "Weight loss program",
                    value: {
                      action: "enrollment_start",
                      brand_slug: "summit-md",
                      category: "weight-loss",
                      portal_origin: "https://care.northstarmd.com",
                      return_url: "https://partner.com/thank-you",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Redirect patient to enrollment_url",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/EnrollmentStartResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        PartnerApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-Partner-Api-Key",
          description: "Secret issued by Peak. Use on server-side requests only.",
        },
      },
      parameters: {
        brand_slug: {
          name: "brand_slug",
          in: "query",
          required: true,
          schema: { type: "string", example: "summit-md" },
          description: "Tenant slug. Optional if API key is scoped to one brand.",
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid API key",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Unauthorized", hint: "Send X-Partner-Api-Key" },
            },
          },
        },
        Forbidden: {
          description: "Key valid but not allowed for this brand_slug",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                error: "Forbidden",
                hint: 'This API key is scoped to brand "summit-md" only',
              },
            },
          },
        },
        NotFound: {
          description: "Brand not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Brand not found" },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            hint: { type: "string" },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            service: { type: "string" },
            version: { type: "string" },
            auth_configured: { type: "boolean" },
          },
        },
        Brand: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            slug: { type: "string" },
            name: { type: "string" },
            domain: { type: "string", nullable: true },
            status: { type: "string" },
          },
        },
        Portals: {
          type: "object",
          properties: {
            enrollment_url: { type: "string", format: "uri" },
            patient_portal_url: { type: "string", format: "uri" },
            patient_login_url: { type: "string", format: "uri" },
            brand_admin_url: { type: "string", format: "uri" },
            affiliate_portal_url: { type: "string", format: "uri" },
            provider_portal_url: { type: "string", format: "uri" },
          },
        },
        BrandPortalsResponse: {
          type: "object",
          properties: {
            brand: { $ref: "#/components/schemas/Brand" },
            portals: { $ref: "#/components/schemas/Portals" },
          },
        },
        CatalogProduct: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            category: { type: "string", nullable: true },
            tagline: { type: "string", nullable: true },
            price_usd: { type: "number", nullable: true },
            enrollment_url: { type: "string", format: "uri" },
          },
        },
        CatalogResponse: {
          type: "object",
          properties: {
            brand: { $ref: "#/components/schemas/Brand" },
            products: {
              type: "array",
              items: { $ref: "#/components/schemas/CatalogProduct" },
            },
            portals: { $ref: "#/components/schemas/Portals" },
          },
        },
        EnrollmentStartRequest: {
          type: "object",
          required: ["action"],
          properties: {
            action: { type: "string", enum: ["enrollment_start"] },
            brand_slug: { type: "string" },
            category: { type: "string" },
            product_id: { type: "string", format: "uuid" },
            portal_origin: { type: "string", format: "uri" },
            return_url: { type: "string", format: "uri" },
          },
        },
        EnrollmentStartResponse: {
          type: "object",
          properties: {
            session_id: { type: "string", format: "uuid" },
            brand: { $ref: "#/components/schemas/Brand" },
            enrollment_url: { type: "string", format: "uri" },
            patient_portal_url: { type: "string", format: "uri" },
            patient_login_url: { type: "string", format: "uri" },
            brand_admin_url: { type: "string", format: "uri" },
            affiliate_portal_url: { type: "string", format: "uri" },
            provider_portal_url: { type: "string", format: "uri" },
            next_step: { type: "string", enum: ["redirect"] },
            message: { type: "string" },
          },
        },
      },
    },
    security: [{ PartnerApiKey: [] }],
  };
}

export function partnerApiDocsHtml(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const openapiUrl = `${base}?action=openapi`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Peak Health Partner API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .peak-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: #e2e8f0;
      padding: 1rem 1.5rem;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .peak-banner strong { color: #fff; }
    .peak-banner a { color: #7dd3fc; }
    .peak-banner code { background: rgba(255,255,255,0.1); padding: 0.1rem 0.35rem; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="peak-banner">
    <strong>Peak Health Partner API (private v${PARTNER_API_VERSION})</strong> —
    Call from your <strong>backend</strong> only. Click <strong>Authorize</strong> and paste your
    <code>X-Partner-Api-Key</code> to try requests. OpenAPI:
    <a href="${openapiUrl}">${openapiUrl}</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: ${JSON.stringify(openapiUrl)},
      dom_id: "#swagger-ui",
      deepLinking: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
      docExpansion: "list",
      filter: true,
    });
  </script>
</body>
</html>`;
}

/** Brand-specific connect guide — returned from GET ?action=connect (auth required). */
export function partnerConnectGuide(
  baseUrl: string,
  brand: { slug: string; id: string; name: string; portal_origin?: string | null },
  apiKeyPlaceholder = "YOUR_API_KEY",
) {
  const base = baseUrl.replace(/\/$/, "");
  const slug = brand.slug;
  const portal = brand.portal_origin?.trim() || null;
  const curls = partnerApiCurlExamples(base, slug, apiKeyPlaceholder);

  return {
    partner: brand.name,
    brand_slug: slug,
    brand_id: brand.id,
    api_base: base,
    auth_header: "X-Partner-Api-Key",
    docs_ui: `${base}?action=docs_ui`,
    openapi: `${base}?action=openapi`,
    postman_import: `Import ${base}?action=openapi into Postman → Import → Link`,
    own_products_note:
      "You can keep your own product pages. Do not build cart/checkout on partner site. Call POST enrollment_start from your backend and redirect to Peak enrollment_url.",
    no_cart_required: true,
    enrollment_contract: {
      source_of_truth: "Peak portals",
      partner_action: "collect product intent only",
      peak_action: "checkout, intake, identity, scheduling, portal",
    },
    journey_steps_9: [
      "1. Partner marketing/product page (your UI, your catalog)",
      "2. Partner backend calls POST enrollment_start",
      "3. Redirect browser to enrollment_url (/care/:slug/shop)",
      "4. Checkout on Peak portal",
      "5. Payment confirmation",
      "6. Account setup",
      "7. Two-factor auth + identity verification",
      "8. Medical intake and scheduling",
      "9. Patient lands in branded patient portal",
    ],
    steps: [
      "Add PARTNER_API_KEY + PARTNER_BRAND_SLUG to your server env (Vercel/hosting). Never in browser.",
      "Add /api/enroll-start on your server that POSTs to this API with header X-Partner-Api-Key.",
      "On Get started (no cart): POST to your /api/enroll-start, then redirect browser to enrollment_url.",
      "After enrollment completes, send patient to patient_portal_url (returned by enrollment_start).",
    ],
    curl: curls,
    enrollment_body_example: {
      action: "enrollment_start",
      brand_slug: slug,
      product_id: "peak-product-uuid-from-mapping-table",
      category: "weight-loss",
      ...(portal ? { portal_origin: portal } : {}),
    },
    vercel_env_example: [
      `PARTNER_API_KEY=${apiKeyPlaceholder}`,
      `PARTNER_BRAND_SLUG=${slug}`,
      `PARTNER_API_URL=${base}`,
      ...(portal ? [`PARTNER_PORTAL_ORIGIN=${portal}`] : []),
    ].join("\n"),
  };
}

export function partnerApiCurlExamples(baseUrl: string, brandSlug: string, apiKeyPlaceholder = "YOUR_API_KEY") {
  const base = baseUrl.replace(/\/$/, "");
  const key = apiKeyPlaceholder;
  const slug = brandSlug;
  return {
    health: `curl "${base}?action=health"`,
    catalog: `curl -H "X-Partner-Api-Key: ${key}" "${base}?action=catalog&brand_slug=${slug}"`,
    brand: `curl -H "X-Partner-Api-Key: ${key}" "${base}?action=brand&brand_slug=${slug}"`,
    enrollment_start: `curl -X POST "${base}" \\
  -H "X-Partner-Api-Key: ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"enrollment_start","brand_slug":"${slug}","category":"weight-loss"}'`,
  };
}
