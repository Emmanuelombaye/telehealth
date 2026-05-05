import {
  DollarSign, TrendingUp, CreditCard, ArrowUpRight,
  CheckCircle2, Clock, Building2, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../../components/ui/shared";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const monthlyRevenue = [
  { month: "Nov", total: 197000 }, { month: "Dec", total: 209000 },
  { month: "Jan", total: 238000 }, { month: "Feb", total: 264000 },
  { month: "Mar", total: 288000 }, { month: "Apr", total: 306000 },
  { month: "May", total: 318600 },
];

const brandFinancials = [
  { brand: "Brand A", mrr: 128400, arr: 1540800, commission: 12840, payout: 115560, plan: "Enterprise", status: "paid" },
  { brand: "Brand B", mrr: 94200, arr: 1130400, commission: 9420, payout: 84780, plan: "Growth", status: "paid" },
  { brand: "Brand C", mrr: 61000, arr: 732000, commission: 6100, payout: 54900, plan: "Growth", status: "pending" },
  { brand: "Brand D", mrr: 35000, arr: 420000, commission: 3500, payout: 31500, plan: "Starter", status: "pending" },
];

const transactions = [
  { id: "TXN-9981", brand: "Brand A", type: "Subscription", amount: "$128,400", date: "May 1, 2026", status: "completed" },
  { id: "TXN-9980", brand: "Brand B", type: "Subscription", amount: "$94,200", date: "May 1, 2026", status: "completed" },
  { id: "TXN-9979", brand: "Brand C", type: "Subscription", amount: "$61,000", date: "May 1, 2026", status: "pending" },
  { id: "TXN-9978", brand: "Brand D", type: "Subscription", amount: "$35,000", date: "May 1, 2026", status: "pending" },
  { id: "TXN-9977", brand: "Brand A", type: "Payout", amount: "$115,560", date: "Apr 30, 2026", status: "completed" },
  { id: "TXN-9976", brand: "Brand B", type: "Payout", amount: "$84,780", date: "Apr 30, 2026", status: "completed" },
];

export function SuperAdminFinancePage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Platform Finance</h1>
          <p className="text-sm text-muted-foreground">Revenue, payouts & billing across all brands</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> Export Report
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Platform MRR", value: "$318,600", change: "+24%", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Platform ARR", value: "$3.82M", change: "+24%", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Total Commission", value: "$31,860", change: "10% rate", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Pending Payouts", value: "$86,400", change: "2 brands", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}>
                <DollarSign className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <span className="text-[10px] font-bold text-emerald-600">{s.change}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Monthly Platform Revenue</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }}
                  formatter={(v: any) => [`$${(v / 1000).toFixed(0)}k`]} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {monthlyRevenue.map((_, i) => (
                    <Cell key={i} fill={i === monthlyRevenue.length - 1 ? "#7c3aed" : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Brand financials */}
      <div>
        <h2 className="font-bold text-sm mb-3">Brand Financials</h2>
        <div className="space-y-2">
          {brandFinancials.map((b, i) => (
            <Card key={i} className="hover:border-violet-400/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {b.brand.split(" ")[1]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{b.brand}</p>
                      <Badge variant="outline" className="text-[9px]">{b.plan}</Badge>
                      <Badge variant={b.status === "paid" ? "success" : "secondary"} className="text-[9px]">{b.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">MRR: <span className="font-bold text-foreground">${(b.mrr / 1000).toFixed(0)}k</span></span>
                      <span className="text-xs text-muted-foreground">ARR: <span className="font-bold text-foreground">${(b.arr / 1000000).toFixed(1)}M</span></span>
                      <span className="text-xs text-muted-foreground">Commission: <span className="font-bold text-violet-600">${b.commission.toLocaleString()}</span></span>
                      <span className="text-xs text-muted-foreground">Payout: <span className="font-bold text-emerald-600">${b.payout.toLocaleString()}</span></span>
                    </div>
                  </div>
                  {b.status === "pending" && (
                    <Button size="sm" className="rounded-xl text-xs h-8 bg-violet-600 hover:bg-violet-700 shrink-0">
                      Process Payout
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="font-bold text-sm mb-3">Recent Transactions</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr>
                  {["ID", "Brand", "Type", "Amount", "Date", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold">{t.id}</td>
                    <td className="px-4 py-3 font-semibold text-xs">{t.brand}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.type}</td>
                    <td className="px-4 py-3 font-bold text-xs text-emerald-600">{t.amount}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.date}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                        t.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40")}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
