import { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared.tsx";
import { cn } from "../../../components/ui/utils";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

type InsurancePlan = {
  id: string;
  provider: string;
  plan_name: string | null;
  member_id: string;
  group_number: string | null;
  deductible_total: number;
  deductible_met: number;
  out_of_pocket_max: number;
};

type CoverageRow = { service: string; coverage: string; copay: string };

function deriveCoverageRows(plan: InsurancePlan): CoverageRow[] {
  const deductible = Number(plan.deductible_total) || 1500;
  const met = Number(plan.deductible_met) || 0;
  const metRatio = deductible > 0 ? met / deductible : 0;
  const hdhp = deductible >= 2500;
  const planLabel = (plan.plan_name || "").toLowerCase();

  const telehealthCopay = planLabel.includes("premium") || planLabel.includes("platinum") ? "$0" : "$0";
  const labCoverage = metRatio >= 1 ? "100%" : hdhp ? "70%" : "90%";
  const labCopay = metRatio >= 1 ? "$0 copay" : hdhp ? "$40 copay" : "$20 copay";
  const rxCoverage = metRatio >= 0.5 ? (hdhp ? "80%" : "90%") : hdhp ? "60%" : "80%";
  const rxCopay = hdhp ? "$15 copay" : "$10 copay";

  return [
    { service: "Telehealth visits", coverage: "100%", copay: telehealthCopay },
    { service: "Lab work", coverage: labCoverage, copay: labCopay },
    { service: "Primary care (in-network)", coverage: hdhp ? "80%" : "90%", copay: "$25 copay" },
    { service: "Generic medications", coverage: rxCoverage, copay: rxCopay },
    {
      service: "Specialist visits",
      coverage: hdhp ? "70%" : "85%",
      copay: hdhp ? "$50 copay" : "$35 copay",
    },
  ];
};

const emptyPlanForm = {
  provider: "",
  plan_name: "",
  member_id: "",
  group_number: "",
  deductible_total: "1500",
  deductible_met: "0",
  out_of_pocket_max: "5000",
};

export function InsurancePage() {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<InsurancePlan | null>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyPlanForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function fetchData() {
    if (!user?.id) return;
    try {
      const [planRes, claimsRes] = await Promise.all([
        supabase.from("insurance_plans").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("insurance_claims").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setPlan(planRes.data as InsurancePlan | null);
      setClaims(claimsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void fetchData();
  }, [user]);

  const openAddPlan = () => {
    if (plan) {
      setForm({
        provider: plan.provider || "",
        plan_name: plan.plan_name || "",
        member_id: plan.member_id || "",
        group_number: plan.group_number || "",
        deductible_total: String(plan.deductible_total ?? 1500),
        deductible_met: String(plan.deductible_met ?? 0),
        out_of_pocket_max: String(plan.out_of_pocket_max ?? 5000),
      });
    } else {
      setForm(emptyPlanForm);
    }
    setFormError(null);
    setShowAddPlan(true);
  };

  const handleSavePlan = async () => {
    if (!user?.id) return;
    if (!form.provider.trim() || !form.member_id.trim()) {
      setFormError("Provider and member ID are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        user_id: user.id,
        provider: form.provider.trim(),
        plan_name: form.plan_name.trim() || null,
        member_id: form.member_id.trim(),
        group_number: form.group_number.trim() || null,
        deductible_total: Number(form.deductible_total) || 1500,
        deductible_met: Number(form.deductible_met) || 0,
        out_of_pocket_max: Number(form.out_of_pocket_max) || 5000,
        is_primary: true,
      };

      if (plan?.id) {
        const { error } = await supabase.from("insurance_plans").update(payload).eq("id", plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("insurance_plans").insert(payload);
        if (error) throw error;
      }

      setShowAddPlan(false);
      setLoading(true);
      await fetchData();
    } catch (err) {
      console.error(err);
      setFormError("Could not save your plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const coverageRows = plan ? deriveCoverageRows(plan) : [];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Insurance</h1>
        <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5" onClick={openAddPlan}>
          <Plus className="h-3.5 w-3.5" /> {plan ? "Edit Plan" : "Add Plan"}
        </Button>
      </div>

      {!plan ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-10 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">No insurance plan added yet</p>
            <Button className="rounded-xl mt-4" size="sm" onClick={openAddPlan}>
              Add your plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-primary to-violet-600 text-white border-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Primary Insurance</p>
                <h2 className="text-xl font-extrabold mt-1">{plan.provider}</h2>
                <p className="text-white/80 text-sm mt-0.5">{plan.plan_name || "Active Plan"}</p>
              </div>
              <Building2 className="h-8 w-8 text-white/30" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: "Member ID", value: plan.member_id },
                { label: "Group #", value: plan.group_number || "N/A" },
                { label: "Deductible", value: `$${Number(plan.deductible_total).toLocaleString()} / yr` },
                {
                  label: "Out-of-Pocket Max",
                  value: `$${Number(plan.out_of_pocket_max).toLocaleString()} / yr`,
                },
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-white/60 text-[10px] uppercase tracking-wide">{f.label}</p>
                  <p className="text-white font-bold text-sm">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/70">Deductible Met</span>
                <span className="text-white font-bold">
                  ${Number(plan.deductible_met).toLocaleString()} / $
                  {Number(plan.deductible_total).toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: `${Math.min(100, (Number(plan.deductible_met) / Number(plan.deductible_total || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Coverage Summary</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {!plan ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Add a plan to see estimated in-network coverage for common services.
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground pb-1">
                Estimates based on your deductible (${Number(plan.deductible_met).toLocaleString()} met of $
                {Number(plan.deductible_total).toLocaleString()}).
              </p>
              {coverageRows.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <p className="text-sm">{c.service}</p>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{c.coverage}</p>
                    <p className="text-[10px] text-muted-foreground">{c.copay}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-bold text-sm mb-3">Recent Claims</h2>
        <div className="space-y-2">
          {claims.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">No recent claims found</p>
          ) : (
            claims.map((claim) => (
              <Card key={claim.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${claim.status === "approved" ? "bg-emerald-100" : "bg-amber-100"}`}
                    >
                      {claim.status === "approved" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{claim.service_name}</p>
                      <p className="text-xs text-muted-foreground">{claim.provider_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                        <span className="text-muted-foreground">
                          Billed: <span className="font-semibold text-foreground">${claim.billed_amount}</span>
                        </span>
                        <span className="text-emerald-600">
                          Covered: <span className="font-semibold">${claim.covered_amount}</span>
                        </span>
                        <span className="text-primary">
                          You owe: <span className="font-bold">${claim.patient_responsibility}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {showAddPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{plan ? "Edit insurance plan" : "Add insurance plan"}</h3>
                <button
                  type="button"
                  onClick={() => setShowAddPlan(false)}
                  className="p-1 rounded-lg hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="space-y-3">
                {[
                  { key: "provider", label: "Insurance provider", placeholder: "e.g. Aetna" },
                  { key: "plan_name", label: "Plan name", placeholder: "e.g. Gold PPO" },
                  { key: "member_id", label: "Member ID", placeholder: "Required" },
                  { key: "group_number", label: "Group number", placeholder: "Optional" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-semibold text-muted-foreground">{field.label}</label>
                    <input
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "deductible_total", label: "Deductible" },
                    { key: "deductible_met", label: "Met" },
                    { key: "out_of_pocket_max", label: "OOP max" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-xs font-semibold text-muted-foreground">{field.label}</label>
                      <input
                        type="number"
                        min={0}
                        value={form[field.key as keyof typeof form]}
                        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddPlan(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl" onClick={handleSavePlan} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
