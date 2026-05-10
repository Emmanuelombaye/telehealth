import {
  DollarSign, TrendingUp, CreditCard, ArrowUpRight,
  CheckCircle2, Clock, Building2, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import { usePatientStore } from "../../../../lib/patient-store";

export function SuperAdminFinancePage() {
  const { orders } = usePatientStore();

  const monthlyRevenue = Object.values(orders.reduce((acc, order) => {
     const date = new Date(order.created_at || new Date());
     const month = date.toLocaleString('default', { month: 'short' });
     const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
     if (!acc[month]) acc[month] = { month, total: 0, dateObj: date };
     acc[month].total += amt;
     return acc;
  }, {} as Record<string, { month: string, total: number, dateObj: Date }>))
  .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const brandFinancials = Object.values(orders.reduce((acc, order) => {
    const brand = order.sub_brand || "Peak Health";
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    if (!acc[brand]) acc[brand] = { brand, mrr: 0, arr: 0, commission: 0, payout: 0, plan: "Enterprise", status: "paid" };
    acc[brand].mrr += amt;
    acc[brand].arr = acc[brand].mrr * 12;
    acc[brand].commission = acc[brand].mrr * 0.1;
    acc[brand].payout = acc[brand].mrr - acc[brand].commission;
    return acc;
  }, {} as Record<string, any>));

  const transactions = orders.slice(0, 8).map(o => ({
    id: o.order_number,
    brand: o.sub_brand || "Peak Health",
    type: o.category || "Subscription",
    amount: typeof o.amount === 'number' ? `$${o.amount}` : o.amount || "$0.00",
    date: new Date(o.created_at).toLocaleDateString(),
    status: o.status === 'order_submitted' || o.status === 'medical_review' ? 'pending' : 'completed'
  }));

  const totalPlatformMRR = brandFinancials.reduce((sum, b) => sum + b.mrr, 0);
  const totalPlatformARR = brandFinancials.reduce((sum, b) => sum + b.arr, 0);
  const totalCommission = brandFinancials.reduce((sum, b) => sum + b.commission, 0);
  const pendingPayouts = brandFinancials.reduce((sum, b) => sum + (b.status === 'pending' ? b.payout : 0), 0);
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
          { label: "Platform MRR", value: `$${(totalPlatformMRR).toLocaleString()}`, change: "+Live", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Platform ARR", value: `$${(totalPlatformARR / 1000000).toFixed(2)}M`, change: "+Live", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Total Commission", value: `$${(totalCommission).toLocaleString()}`, change: "10% rate", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Pending Payouts", value: `$${(pendingPayouts).toLocaleString()}`, change: "System", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
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
