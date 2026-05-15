import { useNavigate } from "react-router";
import { RefreshCw, Users, ArrowRightLeft, Stethoscope, Search, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared.tsx";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";

export function DoctorReferralsPage() {
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0A2E1F]">
            <ArrowRightLeft className="h-6 w-6 text-emerald-700" /> Specialist referrals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track outbound specialty referrals and inbound transfers. (List below is illustrative until referral rows are wired to Supabase.)
          </p>
        </div>
        <Button
          type="button"
          className="rounded-xl shrink-0"
          onClick={() => navigate(`${doctorBase}/consult`)}
        >
          <Stethoscope className="h-4 w-4 mr-2" /> New from case workspace
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Active outbound", value: "—", icon: ArrowRightLeft, color: "text-violet-600" },
          { title: "Incoming", value: "—", icon: Users, color: "text-emerald-600" },
          { title: "Pending consults", value: "—", icon: RefreshCw, color: "text-amber-600" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-[#0A2E1F]">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Recent referrals</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search patients or specialists…"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0A0D14] focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
                aria-label="Search referrals"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { patient: "Alice Thompson", specialist: "Dr. Sarah Johnson (Cardiology)", date: "May 1, 2026", status: "Pending booking", dir: "Outbound" },
              { patient: "James Brown", specialist: "Dr. Michael Chen (Neurology)", date: "Apr 28, 2026", status: "Consult completed", dir: "Outbound" },
              { patient: "Emily Clark", specialist: "From Dr. Peterson (General)", date: "Apr 25, 2026", status: "Scheduled", dir: "Inbound" },
            ].map((ref, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-100"
              >
                <div className="flex gap-4 items-center min-w-0">
                  <Badge
                    variant={ref.dir === "Outbound" ? "secondary" : "outline"}
                    className={
                      ref.dir === "Outbound"
                        ? "bg-violet-100 text-violet-800 border-violet-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }
                  >
                    {ref.dir}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#0A2E1F] truncate">{ref.patient}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{ref.specialist}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">{ref.date}</p>
                    <div className="flex items-center sm:justify-end gap-1 mt-1">
                      {ref.status === "Consult completed" && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
                      <p
                        className={`text-xs font-semibold ${
                          ref.status === "Consult completed" ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {ref.status}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 shrink-0" type="button" disabled title="Coming soon">
                    View records
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
