(function () {
  const cfg = window.PARTNER_API_CONFIG || {};
  const apiBase = cfg.apiBase || "";
  const brandSlug = cfg.brandSlug || "north-star-md";
  const portalOrigin = cfg.portalOrigin || "";

  const keyInput = document.getElementById("api-key");
  const healthEl = document.getElementById("health-status");
  const brandOut = document.getElementById("brand-out");
  const catalogCards = document.getElementById("catalog-cards");
  const enrollOut = document.getElementById("enroll-out");

  let apiKey = sessionStorage.getItem("partner_api_key") || cfg.partnerApiKey || "";

  if (apiKey) keyInput.value = apiKey;

  document.getElementById("btn-save-key").addEventListener("click", () => {
    apiKey = keyInput.value.trim();
    sessionStorage.setItem("partner_api_key", apiKey);
    alert("Key saved for this browser session.");
    checkHealth();
  });

  function partnerHeaders() {
    return {
      "X-Partner-Api-Key": apiKey,
      "Content-Type": "application/json",
    };
  }

  async function apiGet(action, extra = {}) {
    const params = new URLSearchParams({ action, brand_slug: brandSlug, ...extra });
    const res = await fetch(`${apiBase}?${params}`, { headers: partnerHeaders() });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || res.statusText);
    return json;
  }

  async function apiPost(body) {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: partnerHeaders(),
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.hint || res.statusText);
    return json;
  }

  async function checkHealth() {
    try {
      const res = await fetch(`${apiBase}?action=health`);
      const json = await res.json();
      healthEl.textContent = json.ok
        ? `API online (v${json.version}) · auth configured: ${json.auth_configured}`
        : "API unhealthy";
      healthEl.className = "status ok";
    } catch (e) {
      healthEl.textContent = "API unreachable — deploy partner-api first. " + e.message;
      healthEl.className = "status err";
    }
  }

  document.getElementById("btn-brand").addEventListener("click", async () => {
    brandOut.textContent = "Loading…";
    try {
      if (!apiKey) throw new Error("Set Partner API key first");
      const json = await apiGet("brand");
      brandOut.textContent = JSON.stringify(json, null, 2);
    } catch (e) {
      brandOut.textContent = "Error: " + e.message;
    }
  });

  document.getElementById("btn-catalog").addEventListener("click", async () => {
    catalogCards.innerHTML = "<p>Loading…</p>";
    try {
      if (!apiKey) throw new Error("Set Partner API key first");
      const json = await apiGet("catalog");
      catalogCards.innerHTML = "";
      if (!json.products?.length) {
        catalogCards.innerHTML = "<p>No active products.</p>";
        return;
      }
      json.products.forEach((p) => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `
          <h3>${p.name}</h3>
          <p>${p.tagline || p.category || ""}</p>
          <p class="price">${p.price_usd ? "$" + p.price_usd : ""}</p>
          <button type="button" class="btn btn-small">Enroll via API</button>
        `;
        card.querySelector("button").addEventListener("click", () =>
          startEnrollment(p.category),
        );
        catalogCards.appendChild(card);
      });
    } catch (e) {
      catalogCards.innerHTML = `<p class="err">${e.message}</p>`;
    }
  });

  async function startEnrollment(category) {
    enrollOut.textContent = "Starting enrollment…";
    try {
      if (!apiKey) throw new Error("Set Partner API key first");
      const body = {
        action: "enrollment_start",
        brand_slug: brandSlug,
      };
      if (category) body.category = category;
      if (portalOrigin) body.portal_origin = portalOrigin;

      const json = await apiPost(body);
      enrollOut.textContent = JSON.stringify(json, null, 2);
      if (json.enrollment_url) {
        const go = confirm("Open branded enrollment portal?\n\n" + json.enrollment_url);
        if (go) window.location.href = json.enrollment_url;
      }
    } catch (e) {
      enrollOut.textContent = "Error: " + e.message;
    }
  }

  document.getElementById("btn-enroll").addEventListener("click", () => startEnrollment());

  checkHealth();
  if (apiKey) {
    document.getElementById("btn-brand").click();
  }
})();
