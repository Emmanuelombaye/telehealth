import { Building2, CheckCircle2, Clock, AlertCircle, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";

const claims = [
  { id: 1, service: "General Consultation — May 1", provider: "Dr. Sarah Johnson", billed: "$250", covered: "$200", owed: "$50", status: "approved" },
  { id: 2, service: "Lab Work — CBC Panel", provider: "BH Lab Services", billed: "$180", covered: "$180", owed: "$0", status: "approved" },
  { id: 3, service: "Cardiology Consult — Apr 22", provider: "Dr. Michael Chen", billed: "$400", covered: "$320", owed: "$80", status: "pending" },
  { id: 4, service: "Prescription — Lisinopril", provider: "CVS Pharmacy", billed: "$45", covered: "$35", owed: "$10", status: "approved" },
];

export function InsurancePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Insurance</h1>
        <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Plan
        </Button>
      </div>

      {/* Active Plan */}
      <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Primary Insurance</p>
              <h2 className="text-xl font-extrabold mt-1">BlueCross BlueShield</h2>
              <p className="text-white/80 text-sm mt-0.5">PPO Gold Plan</p>
            </div>
            <Building2 className="h-8 w-8 text-white/30" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Member ID", value: "BCB-492-2026" },
              { label: "Group #", value: "GRP-88421" },
              { label: "Deductible", value: "$1,500 / yr" },
              { label: "Out-of-Pocket Max", value: "$5,000 / yr" },
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
              <span className="text-white font-bold">$820 / $1,500</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: "55%" }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Coverage Summary</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {[
            { service: "Primary Care Visits", coverage: "90%", copay: "$20 copay" },
            { service: "Specialist Visits", coverage: "80%", copay: "$40 copay" },
            { service: "Telehealth", coverage: "100%", copay: "$0 copay" },
            { service: "Lab Work", coverage: "100%", copay: "$0 copay" },
            { service: "Prescriptions (Generic)", coverage: "80%", copay: "$10 copay" },
            { service: "Emergency Room", coverage: "80%", copay: "$150 copay" },
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
          {claims.map(claim => (
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
                    <p className="text-sm font-semibold truncate">{claim.service}</p>
                    <p className="text-xs text-muted-foreground">{claim.provider}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-muted-foreground">Billed: <span className="font-semibold text-foreground">{claim.billed}</span></span>
                      <span className="text-emerald-600">Covered: <span className="font-semibold">{claim.covered}</span></span>
                      <span className="text-primary">You owe: <span className="font-bold">{claim.owed}</span></span>
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
