import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Search, Users, Activity,
  ChevronRight, Stethoscope, BarChart3, ArrowLeft,
  X, Loader2, ShieldCheck, Globe2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";
import { BrandDetailConfig } from "../../../components/superadmin/BrandDetailConfig.tsx";
import { slugifyBrandName } from "../../../../lib/superadmin/partnerApi";

type BrandListItem = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  country: string | null;
  status: string;
  plan: string | null;
  patients: number;
  doctors: number;
  mrr: number;
  growth: number;
  logo_url?: string | null;
  portal_origin?: string | null;
};

export function SuperAdminBrandsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dbBrands, setDbBrands] = useState<BrandListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  const [newBrand, setNewBrand] = useState({
    name: "",
    slug: "",
    domain: "",
    portal_origin: "",
    marketing_hostname: "",
    country: "🇺🇸 United States",
    plan: "Enterprise",
    issueApiKey: true,
  });

  async function fetchBrands() {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select(
          "id, name, slug, domain, country, status, plan, patients_count, doctors_count, mrr, growth, logo_url, portal_origin",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;

      setDbBrands(
        (data || []).map((d) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          domain: d.domain,
          country: d.country,
          status: d.status,
          plan: d.plan,
          patients: d.patients_count ?? 0,
          doctors: d.doctors_count ?? 0,
          mrr: Number(d.mrr ?? 0),
          growth: Number(d.growth ?? 0),
          logo_url: d.logo_url,
          portal_origin: d.portal_origin,
        })),
      );
    } catch (err) {
      console.error("Error fetching brands:", err);
      setDbBrands([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchBrands();
    const channel = supabase
      .channel("brands-sync-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "brands" }, () => {
        void fetchBrands();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const selected = dbBrands.find((b) => b.id === selectedId) ?? null;

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);

    try {
      const slug = (newBrand.slug || slugifyBrandName(newBrand.name)).trim().toLowerCase();
      if (!slug) throw new Error("Brand slug is required");

      const { data: inserted, error } = await supabase
        .from("brands")
        .insert([
          {
            name: newBrand.name.trim(),
            slug,
            domain: newBrand.domain.trim() || null,
            portal_origin: newBrand.portal_origin.trim() || null,
            country: newBrand.country,
            plan: newBrand.plan,
            status: "active",
            since_date: new Date().toLocaleString("default", { month: "short", year: "numeric" }),
            patients_count: 0,
            doctors_count: 0,
            staff_count: 0,
            mrr: 0,
            growth: 0,
            products: [],
            gateways: ["Stripe"],
            languages: ["English"],
            revenue_data: [],
            orders_data: { total: 0, pending: 0, shipped: 0, completed: 0 },
            compliance: { hipaa: true, gdpr: true, soc2: false },
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      const brandId = inserted.id as string;

      const host = newBrand.marketing_hostname.trim().toLowerCase().replace(/^www\./, "");
      if (host) {
        const { error: hostErr } = await supabase.from("brand_hostnames").insert([
          { brand_id: brandId, hostname: host, host_kind: "marketing", is_primary: true },
        ]);
        if (hostErr) console.warn("Hostname insert:", hostErr.message);
      }

      if (newBrand.issueApiKey) {
        const { data: keyData, error: keyErr } = await supabase.rpc("issue_partner_api_key", {
          p_brand_id: brandId,
          p_label: "default",
        });
        if (keyErr) {
          toast.warning(
            "Brand created but API key failed — open brand → Partner API tab after running migration 20260604120000_superadmin_partner_api_rpc.sql",
          );
        } else if (keyData?.api_key) {
          toast.success("Brand + API key created — open brand to copy the key");
        }
      } else {
        toast.success("Brand created");
      }

      setShowProvisionModal(false);
      setNewBrand({
        name: "",
        slug: "",
        domain: "",
        portal_origin: "",
        marketing_hostname: "",
        country: "🇺🇸 United States",
        plan: "Enterprise",
        issueApiKey: true,
      });
      await fetchBrands();
      setSelectedId(brandId);
    } catch (err: unknown) {
      console.error("Provisioning error:", err);
      toast.error(err instanceof Error ? err.message : "Could not create brand");
    } finally {
      setProvisioning(false);
    }
  };

  const filtered = dbBrands.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.slug?.toLowerCase().includes(search.toLowerCase()) ||
      b.domain?.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <SuperAdminShell eyebrow="Brands" title="Partner brands" description="Loading directory…">
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
        </div>
      </SuperAdminShell>
    );
  }

  if (selected) {
    return (
      <BrandDetailConfig
        brand={selected}
        onBack={() => setSelectedId(null)}
        onUpdated={() => void fetchBrands()}
      />
    );
  }

  return (
    <>
      <SuperAdminShell
        eyebrow="Brands"
        title="Partner brands"
        description="Create partners, issue API keys, hostnames, and integration handoff — all from this UI."
        actions={
          <Button
            type="button"
            onClick={() => setShowProvisionModal(true)}
            size="sm"
            className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            New partner brand
          </Button>
        }
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none ring-emerald-500/20 focus:ring-2 placeholder:text-slate-400"
            placeholder="Search by name, slug, or domain…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[
            {
              label: "Active brands",
              value: String(dbBrands.filter((b) => b.status === "active").length),
              icon: Activity,
            },
            {
              label: "Patients",
              value: dbBrands.reduce((sum, b) => sum + (b.patients || 0), 0).toLocaleString(),
              icon: Users,
            },
            {
              label: "Doctors",
              value: dbBrands.reduce((sum, b) => sum + (b.doctors || 0), 0),
              icon: Stethoscope,
            },
            {
              label: "Aggregate MRR",
              value: `$${(dbBrands.reduce((sum, b) => sum + (b.mrr || 0), 0) / 1000).toFixed(1)}k`,
              icon: DollarSign,
            },
          ].map((s, i) => (
            <Card key={i} className={saPanel}>
              <CardContent className="space-y-2 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{s.value}</p>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((brand, i) => (
            <motion.div
              key={brand.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.25) }}
              onClick={() => setSelectedId(brand.id)}
              className="cursor-pointer"
            >
              <Card className={cn(saPanel, "h-full transition-shadow hover:shadow-md")}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-emerald-400">
                      {brand.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-slate-900">{brand.name}</h3>
                        <Badge variant="outline" className="text-[10px] font-normal capitalize">
                          {brand.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">{brand.slug}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <Globe2 className="h-3.5 w-3.5 shrink-0" />
                        {brand.domain || brand.portal_origin || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>{brand.plan}</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      Configure API <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </SuperAdminShell>

      <AnimatePresence>
        {showProvisionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => !provisioning && setShowProvisionModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600">New partner</p>
                  <h2 className="text-lg font-semibold text-slate-900">Provision brand + API</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={(e) => void handleProvision(e)} className="space-y-4 p-6">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">Brand name</span>
                  <Input
                    required
                    placeholder="Summit MD"
                    value={newBrand.name}
                    onChange={(e) =>
                      setNewBrand({
                        ...newBrand,
                        name: e.target.value,
                        slug: newBrand.slug || slugifyBrandName(e.target.value),
                      })
                    }
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">Slug (API + URLs)</span>
                  <Input
                    required
                    placeholder="summit-md"
                    value={newBrand.slug}
                    onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })}
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">Domain</span>
                  <Input
                    placeholder="summitmd.com"
                    value={newBrand.domain}
                    onChange={(e) => setNewBrand({ ...newBrand, domain: e.target.value })}
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">Partner site URL (portal_origin)</span>
                  <Input
                    placeholder="https://summitmd.vercel.app"
                    value={newBrand.portal_origin}
                    onChange={(e) =>
                      setNewBrand({
                        ...newBrand,
                        portal_origin: e.target.value,
                        marketing_hostname:
                          newBrand.marketing_hostname ||
                          (() => {
                            try {
                              return new URL(e.target.value).hostname;
                            } catch {
                              return "";
                            }
                          })(),
                      })
                    }
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">Marketing hostname</span>
                  <Input
                    placeholder="summitmd.vercel.app"
                    value={newBrand.marketing_hostname}
                    onChange={(e) => setNewBrand({ ...newBrand, marketing_hostname: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">Optional — for hostname routing if needed later.</p>
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={newBrand.issueApiKey}
                    onChange={(e) => setNewBrand({ ...newBrand, issueApiKey: e.target.checked })}
                  />
                  Issue Partner API key immediately
                </label>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                  <ShieldCheck className="mb-1 inline h-4 w-4" /> After create, open the brand →{" "}
                  <strong>Partner API</strong> tab to copy the key and handoff packet for the partner dev team.
                </div>

                <Button
                  type="submit"
                  disabled={provisioning}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {provisioning ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Create partner brand"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
