import { DollarSign, TrendingUp, CreditCard, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueData = [
  { month: "Jan", revenue: 42000 }, { month: "Feb", revenue: 48000 }, { month: "Mar", revenue: 55000 },
  { month: "Apr", revenue: 51000 }, { month: "May", revenue: 67000 },
];

const transactions = [
  { id: "TXN-8821", patient: "Alice Thompson", amount: "+$75.00", type: "Consultation", date: "May 19", status: "paid" },
  { id: "TXN-8820", patient: "Robert Wilson", amount: "+$200.00", type: "Cardiology", date: "May 18", status: "paid" },
  { id: "TXN-8819", patient: "Sarah Miller", amount: "+$120.00", type: "Mental Health", date: "May 18", status: "pending" },
  { id: "TXN-8818", patient: "James Brown", amount: "-$60.00", type: "Refund", date: "May 17", status: "refunded" },
];

export function AdminFinancePage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Finances</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: "$263K", change: "+18%", up: true },
          { label: "This Month", value: "$67K", change: "+26%", up: true },
          { label: "Pending", value: "$4.2K", change: "12 invoices", up: null },
          { label: "Refunds", value: "$1.1K", change: "-3%", up: false },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">{s.label}</p>
              <p className="text-xl font-extrabold mt-1">{s.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${s.up === true ? "text-emerald-600" : s.up === false ? "text-red-600" : "text-muted-foreground"}`}>
                {s.up === true && <ArrowUpRight className="h-3 w-3" />}
                {s.up === false && <ArrowDownRight className="h-3 w-3" />}
                {s.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Revenue Trend</CardTitle></CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="fin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", fontSize: 12 }} formatter={(v: any) => [`$${(v/1000).toFixed(0)}k`]} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#fin)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Recent Transactions</h2>
          <Button size="sm" variant="ghost" className="text-xs text-primary gap-1"><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
        <div className="space-y-2">
          {transactions.map(tx => (
            <Card key={tx.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${tx.status === "refunded" ? "bg-red-100 dark:bg-red-950/40" : "bg-emerald-100 dark:bg-emerald-950/40"}`}>
                    <CreditCard className={`h-4 w-4 ${tx.status === "refunded" ? "text-red-600" : "text-emerald-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{tx.patient}</p>
                    <p className="text-xs text-muted-foreground">{tx.type} · {tx.id} · {tx.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tx.amount.startsWith("+") ? "text-emerald-600" : "text-red-600"}`}>{tx.amount}</p>
                    <Badge variant={tx.status === "paid" ? "success" : tx.status === "pending" ? "secondary" : "destructive"} className="text-[10px]">{tx.status}</Badge>
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
