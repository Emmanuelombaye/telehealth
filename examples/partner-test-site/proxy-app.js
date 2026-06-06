async function loadCatalog() {
  const cards = document.getElementById("catalog-cards");
  cards.innerHTML = "Loading…";
  try {
    const res = await fetch("/api/catalog");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || res.statusText);
    cards.innerHTML = "";
    (json.products || []).forEach((p) => {
      const el = document.createElement("article");
      el.className = "card";
      el.innerHTML = `<h3>${p.name}</h3><p>${p.tagline || ""}</p><p class="price">$${p.price_usd || ""}</p>`;
      cards.appendChild(el);
    });
    if (!json.products?.length) cards.innerHTML = "<p>No products.</p>";
  } catch (e) {
    cards.innerHTML = `<p class="err">${e.message}</p>`;
  }
}

document.getElementById("btn-load").addEventListener("click", loadCatalog);

document.getElementById("btn-enroll").addEventListener("click", async () => {
  const out = document.getElementById("out");
  out.textContent = "Starting…";
  try {
    const res = await fetch("/api/enrollment_start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal_origin: window.location.origin.includes("localhost") ? "https://www.peak-health.io" : window.location.origin }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.hint || res.statusText);
    out.textContent = JSON.stringify(json, null, 2);
    if (json.enrollment_url && confirm("Open branded enrollment portal?")) {
      window.location.href = json.enrollment_url;
    }
  } catch (e) {
    out.textContent = "Error: " + e.message;
  }
});

loadCatalog();
