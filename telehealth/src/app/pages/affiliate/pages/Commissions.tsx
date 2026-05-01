import { TrendingUp, DollarSign, Users, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/shared";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const earningsData = [
  { month: "Nov", earned: 420 }, { month: "Dec", earned: 680 }, { month: "Jan", earned: 520 },
  { month: "Feb", earned: 840 }, { month: "Mar", earned: 960 }, { month: "Apr", earned: 1120 },
];

const referrals = [
  { name: "Alice Thompson", date: "May 1, 2026", plan: "Gold Premium", commission: "$120.00", status: "confirmed" },
  { name: "Robert Wilson", date: "Apr 28, 2026", plan: "Silver Standard", commission: "$80.00", status: "confirmed" },
  { name: "Maria Garcia", date: "Apr 20, 2026", plan: "Gold Premium", commission: "$120.00", status: "pending" },
  { name: "James Brown", date: "Apr 10, 2026", plan: "Bronze Basic", commission: "$40.00", status: "confirmed" },
  { name: "Emily Clark", date: "Mar 30, 2026", plan: "Silver Standard", commission: "$80.00", status: "paid" },
];

export function AffiliateCommissionsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-orange-500" /> Commissions</h1>
        <p className="text-sm text-muted-foreground">Track your earnings and commission history from patient referrals.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Earned (All Time)", value: "$4,540", color: "text-orange-500" },
          { label: "This Month", value: "$1,120", color: "text-emerald-500" },
          { label: "Pending Payout", value: "$200", color: "text-amber-500" },
          { label: "Successful Referrals", value: "38", color: "text-blue-500" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-5">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Earnings</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `$${v}`} />
                <Bar dataKey="earned" fill="#f97316" radius={[4, 4, 0, 0]} name="Earned ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Commissions</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.plan} · {r.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-emerald-600">{r.commission}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === "paid" ? "bg-emerald-100 text-emerald-700" : r.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
