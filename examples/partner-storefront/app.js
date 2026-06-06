const pill = document.getElementById("api-pill");
const catalogEl = document.getElementById("catalog");
const portalLinks = document.getElementById("portal-links");
const docsOut = document.getElementById("docs-out");
const lastResponse = document.getElementById("last-response");
const statMode = document.getElementById("stat-mode");
const statBrand = document.getElementById("stat-brand");
const statOrigin = document.getElementById("stat-origin");

function showResponse(label, data) {
  lastResponse.textContent = `${label}\n\n${JSON.stringify(data, null, 2)}`;
}

async function apiGet(path) {
  const res = await fetch(`/api/${path}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.hint || res.statusText);
  return json;
}

async function apiPost(path, body) {
  const res = await fetch(`/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.hint || res.statusText);
  return json;
}

function renderCatalog(products) {
  catalogEl.innerHTML = "";
  if (!products?.length) {
    catalogEl.innerHTML = '<p class="muted">No active products returned.</p>';
    return;
  }
  for (const p of products) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.tagline || p.category || "")}</p>
      <p class="price">${p.price_usd ? `$${p.price_usd}/mo` : ""}</p>
      <button type="button" class="btn btn-primary btn-block">Enroll — POST enrollment_start</button>
    `;
    card.querySelector("button").addEventListener("click", () =>
      startEnrollment({ category: p.category, product_id: p.id }),
    );
    catalogEl.appendChild(card);
  }
}

function renderPortals(portals) {
  portalLinks.innerHTML = "";
  const entries = [
    ["Enrollment shop", portals.enrollment_url],
    ["Patient portal", portals.patient_portal_url],
    ["Patient login", portals.patient_login_url],
    ["Brand admin", portals.brand_admin_url],
    ["Affiliate", portals.affiliate_portal_url],
    ["Providers", portals.provider_portal_url],
  ];
  for (const [label, href] of entries) {
    if (!href) continue;
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escapeHtml(label)}</strong><br /><a href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHtml(href)}</a>`;
    portalLinks.appendChild(li);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

async function startEnrollment(extra = {}) {
  try {
    const json = await apiPost("enrollment_start", {
      portal_origin: statOrigin.textContent !== "—" ? statOrigin.textContent : undefined,
      return_url: window.location.href,
      ...extra,
    });
    showResponse("POST enrollment_start", json);
    if (json.enrollment_url && confirm("Open branded enrollment portal?\n\n" + json.enrollment_url)) {
      window.location.href = json.enrollment_url;
    }
  } catch (e) {
    showResponse("POST enrollment_start ERROR", { error: e.message });
  }
}

async function boot() {
  try {
    const [health, config, docs, brand, catalog] = await Promise.all([
      apiGet("health"),
      apiGet("config"),
      apiGet("docs"),
      apiGet("brand"),
      apiGet("catalog"),
    ]);

    const mode = health.mode || config.mode || "unknown";
    pill.textContent = health.ok ? `API online · ${mode}` : "API error";
    pill.className = "pill " + (health.ok ? (mode.includes("mock") ? "warn" : "ok") : "err");

    statMode.textContent = mode;
    statBrand.textContent = brand.brand?.name || config.brand_slug || "—";
    statOrigin.textContent = config.portal_origin || "—";

    docsOut.textContent = JSON.stringify(docs, null, 2);
    renderPortals(brand.portals || catalog.portals || {});
    renderCatalog(catalog.products);
    showResponse("GET catalog", catalog);
  } catch (e) {
    pill.textContent = "API unreachable";
    pill.className = "pill err";
    catalogEl.innerHTML = `<p class="err">${escapeHtml(e.message)}</p>`;
    showResponse("Boot error", { error: e.message });
  }
}

document.getElementById("btn-reload").addEventListener("click", boot);
document.getElementById("btn-hero-enroll").addEventListener("click", () => startEnrollment());
boot();
