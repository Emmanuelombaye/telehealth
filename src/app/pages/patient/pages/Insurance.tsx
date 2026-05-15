import { useState, useEffect } from "react";
import { Building2, CheckCircle2, Clock, AlertCircle, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

export function InsurancePage() {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      try {
        const [planRes, claimsRes] = await Promise.all([
          supabase.from('insurance_plans').select('*').eq('user_id', user!.id).maybeSingle(),
          supabase.from('insurance_claims').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
        ]);
        setPlan(planRes.data);
        setClaims(claimsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Insurance</h1>
        <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Plan
        </Button>
      </div>

      {/* Active Plan */}
      {!plan ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-10 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">No insurance plan added yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-primary to-violet-600 text-white border-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Primary Insurance</p>
                <h2 className="text-xl font-extrabold mt-1">{plan.provider}</h2>
                <p className="text-white/80 text-sm mt-0.5">{plan.plan_name || 'Active Plan'}</p>
              </div>
              <Building2 className="h-8 w-8 text-white/30" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: "Member ID", value: plan.member_id },
                { label: "Group #", value: plan.group_number || 'N/A' },
                { label: "Deductible", value: `$${plan.deductible_total?.toLocaleString()} / yr` },
                { label: "Out-of-Pocket Max", value: `$${plan.out_of_pocket_max?.toLocaleString()} / yr` },
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
                <span className="text-white font-bold">${plan.deductible_met?.toLocaleString()} / ${plan.deductible_total?.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${(plan.deductible_met / plan.deductible_total) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coverage Placeholder - Still static but aligned with healthcare apps */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Coverage Summary</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {[
            { service: "Telehealth", coverage: "100%", copay: "$0 copay" },
            { service: "Lab Work", coverage: "100%", copay: "$0 copay" },
            { service: "Primary Care", coverage: "90%", copay: "$20 copay" },
            { service: "Generic Meds", coverage: "80%", copay: "$10 copay" },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <p className="text-sm">{c.service}</p>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{c.coverage}</p>
                <p className="text-[10px] text-muted-foreground">{c.copay}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Claims */}
      <div>
        <h2 className="font-bold text-sm mb-3">Recent Claims</h2>
        <div className="space-y-2">
          {claims.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">No recent claims found</p>
          ) : claims.map(claim => (
            <Card key={claim.id} className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${claim.status === "approved" ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-amber-100 dark:bg-amber-950/40"}`}>
                    {claim.status === "approved"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      : <Clock className="h-4 w-4 text-amber-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{claim.service_name}</p>
                    <p className="text-xs text-muted-foreground">{claim.provider_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-muted-foreground">Billed: <span className="font-semibold text-foreground">${claim.billed_amount}</span></span>
                      <span className="text-emerald-600">Covered: <span className="font-semibold">${claim.covered_amount}</span></span>
                      <span className="text-primary">You owe: <span className="font-bold">${claim.patient_responsibility}</span></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
