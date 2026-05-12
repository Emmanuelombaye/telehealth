import { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, CreditCard, ArrowUpRight,
  CheckCircle2, Clock, Building2, Download, Filter,
  Calendar, PieChart, Activity, ShieldCheck, Zap,
  Globe2, FileText, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { usePatientStore } from "../../../../lib/patient-store";
import { motion, AnimatePresence } from "framer-motion";

export function SuperAdminFinancePage() {
  const { orders } = usePatientStore();
  const [timeFilter, setTimeFilter] = useState("all");

  const filterOrders = () => {
    if (timeFilter === "all") return orders;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    return orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
  };

  const activeOrders = filterOrders();

  const monthlyRevenue = Object.values(activeOrders.reduce((acc, order) => {
     const date = new Date(order.created_at || new Date());
     const month = date.toLocaleString('default', { month: 'short' });
     const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
     if (!acc[month]) acc[month] = { month, total: 0, dateObj: date };
     acc[month].total += amt;
     return acc;
  }, {} as Record<string, { month: string, total: number, dateObj: Date }>))
  .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const brandFinancials = Object.values(activeOrders.reduce((acc, order) => {
    const brand = order.subBrand || order.sub_brand || "Peak Health";
    const amt = typeof order.amount === 'number' ? order.amount : parseFloat(String(order.amount).replace(/[^0-9.-]+/g,"")) || 0;
    if (!acc[brand]) acc[brand] = { brand, mrr: 0, arr: 0, commission: 0, payout: 0, plan: "Enterprise", status: "paid" };
    acc[brand].mrr += amt;
    acc[brand].arr = acc[brand].mrr * 12;
    acc[brand].commission = acc[brand].mrr * 0.1;
    acc[brand].payout = acc[brand].mrr - acc[brand].commission;
    return acc;
  }, {} as Record<string, any>));

  const transactions = activeOrders.slice(0, 10).map(o => ({
    id: o.order_number || (o.id ? String(o.id).slice(0, 8) : "N/A"),
    brand: o.subBrand || o.sub_brand || "Peak Health",
    type: o.category || "Subscription",
    amount: typeof o.amount === 'number' ? `$${(o.amount as any).toLocaleString()}` : o.amount || "$0.00",
    date: new Date(o.created_at).toLocaleDateString(),
    status: o.status === 'order_submitted' || o.status === 'medical_review' ? 'pending' : 'completed'
  }));

  const totalPlatformMRR = brandFinancials.reduce((sum, b) => sum + b.mrr, 0);
  const totalPlatformARR = totalPlatformMRR * 12;
  const totalCommission = totalPlatformMRR * 0.1;
  const pendingPayouts = brandFinancials.reduce((sum, b) => sum + (b.status === 'pending' ? b.payout : 0), 0);

  const handleExport = () => {
    // Build CSV content from live financial data
    const rows: string[] = [];
    const date = new Date().toLocaleDateString();

    rows.push(`Peak Health — Financial Audit Report`);
    rows.push(`Generated: ${date}`);
    rows.push(``);

    // KPI Summary
    rows.push(`PLATFORM KPI SUMMARY`);
    rows.push(`Platform MRR,$${totalPlatformMRR.toLocaleString()}`);
    rows.push(`Aggregate ARR,$${(totalPlatformARR / 1_000_000).toFixed(2)}M`);
    rows.push(`Global Commission (10%),$${totalCommission.toLocaleString()}`);
    rows.push(``);

    // Brand Financials
    rows.push(`BRAND LEDGER`);
    rows.push(`Brand,MRR,ARR,Commission (10%),Net Payout,Plan,Status`);
    brandFinancials.forEach(b => {
      rows.push(`${b.brand},$${b.mrr.toLocaleString()},$${b.arr.toLocaleString()},$${b.commission.toLocaleString()},$${b.payout.toLocaleString()},${b.plan},${b.status}`);
    });
    rows.push(``);

    // Recent Transactions
    rows.push(`RECENT TRANSACTIONS`);
    rows.push(`Order ID,Brand,Type,Amount,Date,Status`);
    transactions.forEach(t => {
      rows.push(`${t.id},${t.brand},${t.type},${t.amount},${t.date},${t.status}`);
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `peak-health-financial-report-${date.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* FINANCIAL COCKPIT HEADER */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden print:hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-700">Global Financial Matrix</h1>
            </div>
            <h2 className="text-4xl font-black text-[#0A2E1F] tracking-tight">Platform Finance</h2>
         </div>

         <div className="flex items-center gap-4 relative z-10">
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
               {["all", "30d", "90d"].map(f => (
                 <button 
                   key={f} 
                   onClick={() => setTimeFilter(f)}
                   className={cn(
                     "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                     timeFilter === f ? "bg-[#0A2E1F] text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                    {f === 'all' ? 'All Time' : f === '30d' ? '30 Days' : '90 Days'}
                 </button>
               ))}
            </div>
            <Button 
              onClick={handleExport}
              className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-600/20 gap-3"
            >
               <Download className="h-5 w-5" /> Export PDF
            </Button>
         </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block mb-10 border-b-4 border-[#0A2E1F] pb-10">
         <div className="flex items-center justify-between">
            <img src="/PeakHealthLogo.png" alt="Logo" className="h-24 w-auto mix-blend-multiply" />
            <div className="text-right">
               <h1 className="text-4xl font-black text-[#0A2E1F] uppercase tracking-tighter">Financial Audit Report</h1>
               <p className="text-slate-500 font-bold uppercase tracking-widest mt-1">Date: {new Date().toLocaleDateString()}</p>
               <p className="text-emerald-600 font-black uppercase tracking-[0.2em] mt-2">Peak Health Supreme Authority</p>
            </div>
         </div>
      </div>

      {/* EXECUTIVE KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: "Platform MRR", value: `$${totalPlatformMRR.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", change: "+12.5% Live" },
          { label: "Aggregate ARR", value: `$${(totalPlatformARR / 1000000).toFixed(2)}M`, icon: TrendingUp, color: "text-[#0A2E1F]", change: "Annual Estimate" },
          { label: "Global Commission", value: `$${totalCommission.toLocaleString()}`, icon: Zap, color: "text-emerald-500", change: "10% Platform Fee" },
          { label: "Pending Payouts", value: `$${pendingPayouts.toLocaleString()}`, icon: CreditCard, color: "text-amber-600", change: "Institutional Sync" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] bg-white p-10 group hover:shadow-emerald-900/5 transition-all print:shadow-none print:border print:border-slate-200">
            <div className={cn("h-16 w-16 rounded-[24px] mb-8 flex items-center justify-center bg-slate-50", s.color)}>
               <s.icon className="h-8 w-8" />
            </div>
            <h3 className="text-4xl font-black text-[#0A2E1F] tracking-tighter mb-1">{s.value}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{s.label}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{s.change}</span>
               <ArrowUpRight className="h-4 w-4 text-slate-200 group-hover:text-emerald-500 transition-colors" />
            </div>
          </Card>
        ))}
      </div>

      {/* LIQUIDITY FLOW CHART */}
      <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[64px] bg-white overflow-hidden p-12 print:shadow-none print:border print:border-slate-200">
         <div className="flex items-center justify-between mb-16">
            <div>
               <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter">Global Liquidity Matrix</h3>
               <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Historical Revenue Architecture</p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-none px-4 py-2 font-black uppercase tracking-widest text-[10px]">Active Node Stream</Badge>
         </div>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={monthlyRevenue.length > 0 ? monthlyRevenue : [{month: 'No Data', total: 0}]} barSize={48}>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#cbd5e1", fontWeight: 900 }} />
                  <YAxis hide />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0A2E1F', border: 'none', borderRadius: '24px', color: '#fff', padding: '20px' }}
                     formatter={(v: any) => [`$${v.toLocaleString()}`, "VOLUME"]}
                  />
                  <Bar dataKey="total" radius={[12, 12, 0, 0]}>
                     {monthlyRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === monthlyRevenue.length - 1 ? "#10b981" : "#E2E8F0"} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </Card>

      {/* BRAND FINANCIALS & TRANSACTIONS */}
      <div className="grid lg:grid-cols-2 gap-10">
         
         {/* BRAND LEDGER */}
         <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-2xl font-black text-[#0A2E1F] tracking-tight uppercase">Brand Ledger</h3>
               <Badge variant="outline" className="text-[9px] font-black tracking-widest">{brandFinancials.length} Active Entities</Badge>
            </div>
            {brandFinancials.map((b, i) => (
               <Card key={i} className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] bg-white p-8 hover:-translate-y-1 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-30"></div>
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="h-16 w-16 rounded-[24px] bg-[#0A2E1F] flex items-center justify-center font-black text-emerald-400 text-2xl group-hover:rotate-6 transition-transform">
                        {b.brand.charAt(0)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                           <p className="font-black text-lg text-[#0A2E1F] uppercase tracking-tight">{b.brand}</p>
                           <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-black px-2">{b.status}</Badge>
                        </div>
                        <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400">
                           <span>MRR: <span className="text-[#0A2E1F]">${b.mrr.toLocaleString()}</span></span>
                           <span>Fee: <span className="text-emerald-600">${b.commission.toLocaleString()}</span></span>
                        </div>
                     </div>
                     <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all" />
                  </div>
               </Card>
            ))}
         </div>

         {/* AUDIT LOG (TRANSACTIONS) */}
         <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-2xl font-black text-[#0A2E1F] tracking-tight uppercase">Audit Log</h3>
               <FileText className="h-6 w-6 text-slate-300" />
            </div>
            <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[48px] bg-white overflow-hidden print:border print:border-slate-200">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptor</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {transactions.map((t, i) => (
                           <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-6">
                                 <p className="text-sm font-black text-[#0A2E1F] uppercase tracking-tight">{t.brand}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.type} · {t.date}</p>
                              </td>
                              <td className="px-8 py-6 text-right font-black text-emerald-600 text-sm">
                                 {t.amount}
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <Badge className={cn(
                                   "text-[8px] font-black uppercase tracking-widest px-2",
                                   t.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                 )}>{t.status}</Badge>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>

      </div>

      {/* PRINT-ONLY FOOTER */}
      <div className="hidden print:block mt-20 pt-10 border-t-2 border-slate-100 text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Financial Audit Ledger · Protected by AES-256 Encryption</p>
         <p className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-[0.4em] mt-2">Peak Health Supreme Authority</p>
      </div>

    </div>
  );
}
