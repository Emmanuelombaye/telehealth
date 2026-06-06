import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Globe2,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Zap,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import {
  type BrandHostnameRow,
  type IssuedPartnerKey,
  type PartnerApiKeyRow,
  partnerApiBaseUrl,
  partnerApiCurlExamples,
  partnerApiConnectUrl,
  partnerApiDocsUiUrl,
  partnerApiOpenApiUrl,
  partnerHandoffPacket,
} from "../../../lib/superadmin/partnerApi";
import { Button, Badge, Input, cn } from "../ui/shared.tsx";
import { SuperAdminShell, saPanel } from "./SuperAdminShell.tsx";
import { PartnerConnectGuide } from "./PartnerConnectGuide.tsx";
import { Card, CardContent } from "../ui/shared.tsx";

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  logo_url?: string | null;
  portal_origin?: string | null;
  plan?: string;
  country?: string;
};

type TabId = "settings" | "hostnames" | "partner-api";

const HOST_KINDS: BrandHostnameRow["host_kind"][] = [
  "marketing",
  "care",
  "admin",
  "affiliate",
  "api",
];

export function BrandDetailConfig({
  brand,
  onBack,
  onUpdated,
}: {
  brand: BrandRow;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const [tab, setTab] = useState<TabId>("partner-api");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: brand.name,
    slug: brand.slug,
    domain: brand.domain ?? "",
    logo_url: brand.logo_url ?? "",
    portal_origin: brand.portal_origin ?? "",
    status: brand.status ?? "active",
  });

  const [hostnames, setHostnames] = useState<BrandHostnameRow[]>([]);
  const [keys, setKeys] = useState<PartnerApiKeyRow[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [issuingKey, setIssuingKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<IssuedPartnerKey | null>(null);
  const [apiHealth, setApiHealth] = useState<{ ok?: boolean; version?: string } | null>(null);
  const [testingApi, setTestingApi] = useState(false);

  const [newHost, setNewHost] = useState({
    hostname: "",
    host_kind: "marketing" as BrandHostnameRow["host_kind"],
    is_primary: false,
  });

  const loadExtras = useCallback(async () => {
    setLoadingExtras(true);
    try {
      const [hRes, kRes] = await Promise.all([
        supabase
          .from("brand_hostnames")
          .select("id, brand_id, hostname, host_kind, is_primary, created_at")
          .eq("brand_id", brand.id)
          .order("host_kind"),
        supabase
          .from("partner_api_keys")
          .select("id, brand_id, label, key_prefix, status, last_used_at, created_at")
          .eq("brand_id", brand.id)
          .order("created_at", { ascending: false }),
      ]);
      if (hRes.error) throw hRes.error;
      if (kRes.error) throw kRes.error;
      setHostnames((hRes.data ?? []) as BrandHostnameRow[]);
      setKeys((kRes.data ?? []) as PartnerApiKeyRow[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load partner config";
      toast.error(msg);
      setHostnames([]);
      setKeys([]);
    } finally {
      setLoadingExtras(false);
    }
  }, [brand.id]);

  useEffect(() => {
    void loadExtras();
  }, [loadExtras]);

  async function saveSettings() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("brands")
        .update({
          name: form.name.trim(),
          slug: form.slug.trim().toLowerCase(),
          domain: form.domain.trim() || null,
          logo_url: form.logo_url.trim() || null,
          portal_origin: form.portal_origin.trim() || null,
          status: form.status,
        })
        .eq("id", brand.id);
      if (error) throw error;
      toast.success("Brand settings saved");
      onUpdated();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addHostname(e: React.FormEvent) {
    e.preventDefault();
    const hostname = newHost.hostname.trim().toLowerCase().replace(/^www\./, "");
    if (!hostname) return;
    try {
      const { error } = await supabase.from("brand_hostnames").insert([
        {
          brand_id: brand.id,
          hostname,
          host_kind: newHost.host_kind,
          is_primary: newHost.is_primary,
        },
      ]);
      if (error) throw error;
      toast.success("Hostname added");
      setNewHost({ hostname: "", host_kind: "marketing", is_primary: false });
      void loadExtras();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not add hostname");
    }
  }

  async function removeHostname(id: string) {
    if (!confirm("Remove this hostname?")) return;
    try {
      const { error } = await supabase.from("brand_hostnames").delete().eq("id", id);
      if (error) throw error;
      toast.success("Hostname removed");
      void loadExtras();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function issueApiKey() {
    setIssuingKey(true);
    try {
      const { data, error } = await supabase.rpc("issue_partner_api_key", {
        p_brand_id: brand.id,
        p_label: "default",
      });
      if (error) throw error;
      const row = data as IssuedPartnerKey;
      if (!row?.api_key) throw new Error("No key returned — run DB migration 20260604120000_superadmin_partner_api_rpc.sql");
      setRevealedKey(row);
      toast.success("API key issued — copy it now; it will not be shown again.");
      void loadExtras();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not issue API key");
    } finally {
      setIssuingKey(false);
    }
  }

  async function revokeKey(keyId: string) {
    if (!confirm("Revoke this API key? Partner integrations using it will stop working.")) return;
    try {
      const { error } = await supabase.rpc("revoke_partner_api_key", { p_key_id: keyId });
      if (error) throw error;
      toast.success("API key revoked");
      void loadExtras();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Revoke failed");
    }
  }

  async function checkApiHealth() {
    setTestingApi(true);
    setApiHealth(null);
    try {
      const res = await fetch(`${partnerApiBaseUrl()}?action=health`);
      const json = await res.json();
      setApiHealth(json);
      if (json.ok) toast.success(`Partner API online (v${json.version})`);
      else toast.error("Partner API health check failed");
    } catch {
      toast.error("Partner API unreachable — deploy partner-api Edge Function");
    } finally {
      setTestingApi(false);
    }
  }

  function copyText(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  const enrollmentPath = `/care/${form.slug}/shop?brand=${form.slug}&brandId=${brand.id}`;
  const packet = partnerHandoffPacket({
    brandName: form.name,
    brandSlug: form.slug,
    brandId: brand.id,
    apiKey: revealedKey?.api_key,
    portalOrigin: form.portal_origin,
  });

  const tabs: { id: TabId; label: string }[] = [
    { id: "partner-api", label: "Partner API" },
    { id: "hostnames", label: "Hostnames" },
    { id: "settings", label: "Brand settings" },
  ];

  return (
    <SuperAdminShell
      eyebrow="Brand"
      title={form.name}
      description={`${form.slug} · ${form.domain || "no domain"} · Partner onboarding`}
      actions={
        <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          All brands
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "settings" && (
        <Card className={saPanel}>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900">Brand settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Display name</span>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Slug (API + URLs)</span>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Domain</span>
                <Input
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  placeholder="summitmd.com"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-slate-700">Status</span>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Logo URL (optional white-label)</span>
                <Input
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="/brands/partner-logo.svg"
                />
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Partner site origin (portal_origin)</span>
                <Input
                  value={form.portal_origin}
                  onChange={(e) => setForm({ ...form, portal_origin: e.target.value })}
                  placeholder="https://summitmd.vercel.app"
                />
                <p className="text-xs text-slate-500">Partner marketing URL — used in enrollment_start responses.</p>
              </label>
            </div>
            <Button onClick={() => void saveSettings()} disabled={saving} className="bg-slate-900 text-white">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save settings
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "hostnames" && (
        <div className="space-y-4">
          <Card className={saPanel}>
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Globe2 className="h-4 w-4" /> Hostnames
                </h2>
                <Button variant="outline" size="sm" onClick={() => void loadExtras()} disabled={loadingExtras}>
                  <RefreshCw className={cn("h-4 w-4", loadingExtras && "animate-spin")} />
                </Button>
              </div>
              {loadingExtras ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : hostnames.length === 0 ? (
                <p className="text-sm text-slate-500">No hostnames — add partner marketing or care subdomain.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {hostnames.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <span className="font-medium text-slate-900">{h.hostname}</span>
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {h.host_kind}
                        </Badge>
                        {h.is_primary ? (
                          <Badge className="ml-1 bg-emerald-100 text-[10px] text-emerald-800">primary</Badge>
                        ) : null}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => void removeHostname(h.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className={saPanel}>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-slate-900">Add hostname</h3>
              <form onSubmit={(e) => void addHostname(e)} className="grid gap-3 sm:grid-cols-3">
                <Input
                  required
                  placeholder="summitmd.vercel.app"
                  value={newHost.hostname}
                  onChange={(e) => setNewHost({ ...newHost, hostname: e.target.value })}
                  className="sm:col-span-2"
                />
                <select
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                  value={newHost.host_kind}
                  onChange={(e) =>
                    setNewHost({ ...newHost, host_kind: e.target.value as BrandHostnameRow["host_kind"] })
                  }
                >
                  {HOST_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-3">
                  <input
                    type="checkbox"
                    checked={newHost.is_primary}
                    onChange={(e) => setNewHost({ ...newHost, is_primary: e.target.checked })}
                  />
                  Primary for this host kind
                </label>
                <Button type="submit" className="bg-slate-900 text-white sm:col-span-3">
                  <Plus className="mr-2 h-4 w-4" /> Add hostname
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "partner-api" && (
        <div className="space-y-4">
          <PartnerConnectGuide
            brandName={form.name}
            brandSlug={form.slug}
            brandId={brand.id}
            portalOrigin={form.portal_origin}
            apiKey={revealedKey?.api_key}
          />

          <Card className={saPanel}>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Key className="h-4 w-4" /> Partner API keys
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-slate-600">
                    Issue a key here — no Supabase secrets manual step. Keys are stored hashed; partner-api validates
                    against the database.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => void checkApiHealth()} disabled={testingApi}>
                    {testingApi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="mr-1 h-4 w-4" />}
                    Test API
                  </Button>
                  <Button size="sm" className="bg-slate-900 text-white" onClick={() => void issueApiKey()} disabled={issuingKey}>
                    {issuingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                    Issue / rotate key
                  </Button>
                </div>
              </div>

              {apiHealth && (
                <p className="text-xs text-slate-500">
                  API health: {apiHealth.ok ? "online" : "error"} {apiHealth.version ? `v${apiHealth.version}` : ""}
                </p>
              )}

              {loadingExtras ? (
                <p className="text-sm text-slate-500">Loading keys…</p>
              ) : keys.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No API key yet — click <strong>Issue / rotate key</strong> to generate one for this partner.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {keys.map((k) => (
                    <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <div>
                        <span className="font-mono text-slate-800">{k.key_prefix}…</span>
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {k.label}
                        </Badge>
                        <Badge
                          className={cn(
                            "ml-1 text-[10px]",
                            k.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {k.status}
                        </Badge>
                        {k.last_used_at ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            Last used {new Date(k.last_used_at).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                      {k.status === "active" && (
                        <Button variant="outline" size="sm" onClick={() => void revokeKey(k.id)}>
                          Revoke
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {revealedKey && (
            <Card className="border-2 border-emerald-300 bg-emerald-50/50">
              <CardContent className="space-y-3 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-emerald-900">
                  <Shield className="h-5 w-5" />
                  <h3 className="font-semibold">New API key — copy now</h3>
                </div>
                <p className="text-sm text-emerald-800">This is the only time the full key is visible.</p>
                <code className="block break-all rounded-lg bg-white px-4 py-3 text-sm font-mono text-slate-900 shadow-sm">
                  {revealedKey.api_key}
                </code>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => copyText(revealedKey.api_key, "API key")}>
                    <Copy className="mr-2 h-4 w-4" /> Copy key
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyText(packet, "Partner packet")}>
                    <Copy className="mr-2 h-4 w-4" /> Copy handoff packet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRevealedKey(null)}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={saPanel}>
            <CardContent className="space-y-3 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-slate-900">Integration quick reference</h3>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">brand_slug</dt>
                  <dd className="font-mono font-medium">{form.slug}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">brand_id</dt>
                  <dd className="font-mono text-xs">{brand.id}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">API base</dt>
                  <dd className="break-all font-mono text-xs">{partnerApiBaseUrl()}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Enrollment path (deep link fallback)</dt>
                  <dd className="break-all font-mono text-xs">{enrollmentPath}</dd>
                </div>
              </dl>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                <p className="mb-2 font-medium text-slate-700">Quick test (curl)</p>
                <code className="block break-all font-mono text-slate-800">
                  {partnerApiCurlExamples({ brandSlug: form.slug, apiKey: revealedKey?.api_key }).catalog}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 px-2 text-xs"
                  onClick={() =>
                    copyText(
                      partnerApiCurlExamples({
                        brandSlug: form.slug,
                        apiKey: revealedKey?.api_key,
                      }).catalog,
                      "curl catalog",
                    )
                  }
                >
                  <Copy className="mr-1 h-3 w-3" /> Copy curl
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => copyText(packet, "Handoff packet")}>
                  <Copy className="mr-2 h-4 w-4" /> Copy partner packet
                </Button>
                <a
                  href={partnerApiDocsUiUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center rounded-lg border border-emerald-600 bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Open Swagger docs
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyText(
                      `curl -H "X-Partner-Api-Key: YOUR_KEY" "${partnerApiConnectUrl(form.slug)}"`,
                      "connect curl",
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy connect curl
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(partnerApiOpenApiUrl(), "OpenAPI URL")}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy OpenAPI URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </SuperAdminShell>
  );
}
