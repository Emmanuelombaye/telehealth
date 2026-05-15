import { useState } from "react";
import { DollarSign, TrendingUp, CreditCard, Download, FileText, ChevronRight, Zap, ArrowUpRight } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { usePatientStore } from "../../../../lib/patient-store";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";

export function SuperAdminFinancePage() {
  const { orders } = usePatientStore();
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

  const handleExport = () => {
    const rows: string[] = [];
    const date = new Date().toLocaleDateString();

    rows.push(`Peak Health — Financial Audit Report`);
    rows.push(`Generated: ${date}`);
    rows.push(``);

    rows.push(`PLATFORM KPI SUMMARY`);
    rows.push(`Platform MRR,$${totalPlatformMRR.toLocaleString()}`);
    rows.push(`Aggregate ARR,$${(totalPlatformARR / 1_000_000).toFixed(2)}M`);
    rows.push(`Global Commission (10%),$${totalCommission.toLocaleString()}`);
    rows.push(``);

    rows.push(`BRAND LEDGER`);
    rows.push(`Brand,MRR,ARR,Commission (10%),Net Payout,Plan,Status`);
    brandFinancials.forEach((b) => {
      rows.push(
        `${b.brand},$${b.mrr.toLocaleString()},$${b.arr.toLocaleString()},$${b.commission.toLocaleString()},$${b.payout.toLocaleString()},${b.plan},${b.status}`,
      );
    });
    rows.push(``);

    rows.push(`RECENT TRANSACTIONS`);
    rows.push(`Order ID,Brand,Type,Amount,Date,Status`);
    transactions.forEach((t) => {
      rows.push(`${t.id},${t.brand},${t.type},${t.amount},${t.date},${t.status}`);
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `peak-health-financial-report-${date.replace(/\//g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <SuperAdminShell
      eyebrow="Finance"
      title="Platform finance"
      description="MRR and payouts are derived from orders visible to this session. CSV export uses the same aggregation as before."
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
            Export CSV
          </Button>
        </div>
      }
    >
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

      <Card className={cn(saPanel, "print:border print:border-slate-200 print:shadow-none")}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Monthly revenue</h2>
              <p className="text-xs text-slate-500">Filtered by the range control above</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal text-slate-600">
              Live orders
            </Badge>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyRevenue.length > 0 ? monthlyRevenue : [{ month: "—", total: 0, dateObj: new Date() }]}
                barSize={28}
              >
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`$${Number(v).toLocaleString()}`, "Total"]}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {(monthlyRevenue.length > 0 ? monthlyRevenue : [{ month: "—", total: 0, dateObj: new Date() }]).map(
                    (_, index, arr) => (
                      <Cell key={`cell-${index}`} fill={index === arr.length - 1 ? "#059669" : "#cbd5e1"} />
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
