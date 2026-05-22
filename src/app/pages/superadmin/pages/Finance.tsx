import { useState } from "react";
import { DollarSign, TrendingUp, CreditCard, Download, FileText, ChevronRight, Zap, ArrowUpRight } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend } from "recharts";
import { usePatientStore } from "../../../../lib/patient-store";
import { useAuthStore } from "../../../../lib/auth-store";
import { logAdminAudit } from "../../../../lib/adminAudit";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";
import { AdminScopeNotice } from "../../../components/admin/AdminScopeNotice.tsx";

const BRAND_COLORS = ['#059669', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/95 p-3 shadow-xl backdrop-blur-xl">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{label || payload[0].name}</p>
        <p className="text-sm font-black text-white">
          ${Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function SuperAdminFinancePage() {
  const { orders } = usePatientStore();
  const { user } = useAuthStore();
  const [timeFilter, setTimeFilter] = useState("all");

  const filterOrders = () => {
    if (timeFilter === "all") return orders;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    return orders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo);
  };

  const activeOrders = filterOrders();

  const monthlyRevenue = Object.values(
    activeOrders.reduce(
      (acc, order) => {
        const date = new Date(order.created_at || new Date());
        const month = date.toLocaleString("default", { month: "short" });
        const amt =
          typeof order.amount === "number"
            ? order.amount
            : parseFloat(String(order.amount).replace(/[^0-9.-]+/g, "")) || 0;
        if (!acc[month]) acc[month] = { month, total: 0, dateObj: date };
        acc[month].total += amt;
        return acc;
      },
      {} as Record<string, { month: string; total: number; dateObj: Date }>,
    ),
  ).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const brandFinancials = Object.values(
    activeOrders.reduce(
      (acc, order) => {
        const brand = order.subBrand || order.sub_brand || "Peak Health";
        const amt =
          typeof order.amount === "number"
            ? order.amount
            : parseFloat(String(order.amount).replace(/[^0-9.-]+/g, "")) || 0;
        if (!acc[brand]) acc[brand] = { brand, mrr: 0, arr: 0, commission: 0, payout: 0, plan: "Enterprise", status: "paid" };
        acc[brand].mrr += amt;
        acc[brand].arr = acc[brand].mrr * 12;
        acc[brand].commission = acc[brand].mrr * 0.1;
        acc[brand].payout = acc[brand].mrr - acc[brand].commission;
        return acc;
      },
      {} as Record<string, any>,
    ),
  );

  const transactions = activeOrders.slice(0, 10).map((o) => ({
    id: o.order_number || (o.id ? String(o.id).slice(0, 8) : "N/A"),
    brand: o.subBrand || o.sub_brand || "Peak Health",
    type: o.category || "Subscription",
    amount: typeof o.amount === "number" ? `$${(o.amount as any).toLocaleString()}` : o.amount || "$0.00",
    date: new Date(o.created_at).toLocaleDateString(),
    status: o.status === "order_submitted" || o.status === "medical_review" ? "pending" : "completed",
  }));

  const totalPlatformMRR = brandFinancials.reduce((sum, b) => sum + b.mrr, 0);
  const totalPlatformARR = totalPlatformMRR * 12;
  const totalCommission = totalPlatformMRR * 0.1;
  const pendingPayouts = brandFinancials.reduce((sum, b) => sum + (b.status === "pending" ? b.payout : 0), 0);

  const handleExport = async () => {
    const { downloadBrandedReportPdf } = await import("../../../../lib/brandedExport");
    const date = new Date().toISOString().slice(0, 10);
    await logAdminAudit({
      action: "Exported Platform Finance PDF",
      targetType: "finance_ledger",
      detail: { brands_included: brandFinancials.length },
    });
    await downloadBrandedReportPdf({
      filename: `peak-health-financial-report-${date}.pdf`,
      title: "Platform Financial Audit Report",
      subtitle: `Platform-wide ledger · ${date}`,
      sections: [
        { kind: "heading", text: "Platform KPI summary" },
        {
          kind: "kv",
          rows: [
            ["Platform MRR", `$${totalPlatformMRR.toLocaleString()}`],
            ["Aggregate ARR", `$${(totalPlatformARR / 1_000_000).toFixed(2)}M`],
            ["Global commission (10%)", `$${totalCommission.toLocaleString()}`],
            ["Pending payouts", `$${pendingPayouts.toLocaleString()}`],
          ],
        },
        { kind: "heading", text: "Brand ledger" },
        {
          kind: "table",
          headers: ["Brand", "MRR", "ARR", "Commission", "Net payout", "Plan", "Status"],
          rows: brandFinancials.map((b) => [
            b.brand,
            `$${b.mrr.toLocaleString()}`,
            `$${b.arr.toLocaleString()}`,
            `$${b.commission.toLocaleString()}`,
            `$${b.payout.toLocaleString()}`,
            b.plan,
            b.status,
          ]),
        },
        { kind: "heading", text: "Recent transactions" },
        {
          kind: "table",
          headers: ["Order ID", "Brand", "Type", "Amount", "Date", "Status"],
          rows: transactions.map((t) => [t.id, t.brand, t.type, t.amount, t.date, t.status]),
        },
      ],
    });
  };

  return (
    <SuperAdminShell
      eyebrow="Finance"
      title="Platform finance"
      description="Diagram D: platform revenue, fees, and payouts from non-clinical order data. Branded PDF export matches on-screen aggregates."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(["all", "30d", "90d"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTimeFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  timeFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {f === "all" ? "All" : f === "30d" ? "30d" : "90d"}
              </button>
            ))}
          </div>
          <Button
            onClick={handleExport}
            size="sm"
            className="h-9 gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      }
    >
      <AdminScopeNotice variant="platform" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Platform MRR", value: `$${totalPlatformMRR.toLocaleString()}`, icon: DollarSign, hint: "Sum of order amounts" },
          { label: "Implied ARR", value: `$${(totalPlatformARR / 1_000_000).toFixed(2)}M`, icon: TrendingUp, hint: "MRR × 12" },
          { label: "Commission (10%)", value: `$${totalCommission.toLocaleString()}`, icon: Zap, hint: "Illustrative fee" },
          { label: "Pending payouts", value: `$${pendingPayouts.toLocaleString()}`, icon: CreditCard, hint: "Brands marked pending" },
        ].map((s, i) => (
          <Card key={i} className={saPanel}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <s.icon className="h-4 w-4 text-slate-400" />
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />
              </div>
              <p className="text-xl font-semibold tabular-nums text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className="text-[11px] text-slate-400">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Trend (Area Chart) */}
        <Card className={cn(saPanel, "lg:col-span-2 overflow-hidden print:border print:border-slate-200 print:shadow-none")}>
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Revenue Trajectory</h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Cumulative monthly volume across all brands</p>
          </div>
          <CardContent className="p-5 sm:p-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue.length > 0 ? monthlyRevenue : [{ month: "—", total: 0 }]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brand Distribution (Pie Chart) */}
        <Card className={cn(saPanel, "overflow-hidden print:border print:border-slate-200 print:shadow-none")}>
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Portfolio Mix</h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">MRR distribution by brand</p>
          </div>
          <CardContent className="p-5 sm:p-6 flex flex-col items-center justify-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={brandFinancials.length > 0 ? brandFinancials : [{ brand: "No Data", mrr: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="mrr"
                    nameKey="brand"
                    stroke="none"
                  >
                    {(brandFinancials.length > 0 ? brandFinancials : [{ brand: "No Data", mrr: 1 }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance (Modern Bar Chart) */}
      <Card className={cn(saPanel, "mb-6 overflow-hidden print:border print:border-slate-200 print:shadow-none")}>
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Monthly Performance</h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Absolute revenue generation per month</p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase tracking-widest">
            Live Orders
          </Badge>
        </div>
        <CardContent className="p-5 sm:p-6">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyRevenue.length > 0 ? monthlyRevenue : [{ month: "—", total: 0 }]}
                barSize={32}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {(monthlyRevenue.length > 0 ? monthlyRevenue : [{ month: "—", total: 0 }]).map(
                    (_, index, arr) => (
                      <Cell key={`cell-${index}`} fill={index === arr.length - 1 ? "#059669" : "#94a3b8"} />
                    ),
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">By brand</h2>
            <Badge variant="outline" className="text-[10px] font-normal">
              {brandFinancials.length} brands
            </Badge>
          </div>
          <div className="space-y-3">
            {brandFinancials.map((b, i) => (
              <Card key={i} className={saPanel}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-emerald-400">
                    {b.brand.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{b.brand}</p>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {b.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      MRR <span className="font-medium text-slate-900">${b.mrr.toLocaleString()}</span>
                      {" · "}
                      Fee <span className="font-medium text-emerald-700">${b.commission.toLocaleString()}</span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent transactions</h2>
            <FileText className="h-4 w-4 text-slate-400" aria-hidden />
          </div>
          <Card className={cn(saPanel, "overflow-hidden print:border print:border-slate-200")}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Brand / type</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Amount</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{t.brand}</p>
                        <p className="text-xs text-slate-500">
                          {t.type} · {t.date}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-emerald-700">{t.amount}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-normal capitalize",
                            t.status === "completed" ? "border-emerald-200 text-emerald-800" : "border-amber-200 text-amber-800",
                          )}
                        >
                          {t.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <div className="hidden print:block print:border-t print:border-slate-200 print:pt-6 print:text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Peak Health · platform administration</p>
      </div>
    </SuperAdminShell>
  );
}
