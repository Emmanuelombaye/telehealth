import { useState, useEffect } from "react";
import { Download, CreditCard, ExternalLink, RefreshCw, Columns, TrendingUp, ShieldCheck, Activity, ArrowUpRight } from "lucide-react";
import { Card, Button, Badge } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";
import { motion } from "framer-motion";

const tabs = ["Overview", "Invoices", "Contracts"];
const invoiceFilters = ["All", "Paid", "Open", "Failed", "Processing", "Canceled"];

export function AdminFinancePage() {
  const { role } = useAuthStore();
  const [activeTab, setActiveTab] = useState("Overview");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, amount, status, created_at, category')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const mapped = (data || []).map(o => ({
          id: o.id.substring(0,8).toUpperCase(),
          plan: o.category || "Consultation",
          amount: typeof o.amount === 'number' ? `$${o.amount}` : o.amount || "$0.00",
          status: o.status === 'delivered' || o.status === 'shipped' || o.status === 'rx_sent' ? 'Paid' : 'Processing',
          method: "Visa Card ****2792",
          date: new Date(o.created_at).toLocaleDateString()
        }));

        setInvoices(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-10 animate-in fade-in duration-1000">
      
      {/* LUXURY HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-50">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-xl bg-emerald-50 text-[#0A2E1F] border border-emerald-100">
                FINANCIAL COMMAND
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                AUDIT READY
              </span>
           </div>
           <h1 className="text-4xl font-black text-[#0A2E1F] tracking-tighter uppercase italic">
             Financial <span className="text-emerald-600 font-serif italic font-normal">Ledger</span>
           </h1>
           <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
             Authorized Personnel Only • Real-time Revenue Matrix
           </p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" className="rounded-2xl h-14 px-8 border-slate-100 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50">
             Export CSV <Download className="ml-2 h-4 w-4" />
           </Button>
           <Button className="rounded-2xl h-14 px-8 bg-[#0A2E1F] text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-900/10">
             Audit Reports
           </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-10 border-b border-slate-50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
              activeTab === tab
                ? "text-[#0A2E1F]"
                : "text-slate-300 hover:text-slate-500"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0A2E1F] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="grid lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-10">
            {/* Main Stats */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[2.5rem] p-10 bg-white group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="h-32 w-32" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Active Revenue Balance</h3>
                <h2 className="text-5xl font-black text-[#0A2E1F] tracking-tighter italic">$734.25</h2>
                <div className="flex items-center gap-3 mt-6">
                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest">+12.4% PERFORMANCE</Badge>
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-10">Available for Payout</p>
              </Card>

              <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[2.5rem] p-10 bg-[#0A2E1F] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100/40 mb-8">Current Subscription</h3>
                <h2 className="text-4xl font-black tracking-tight uppercase">Enterprise</h2>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-2xl font-black text-emerald-400 italic">$4,499.99</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/40">USD / MONTHLY</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-100/30 uppercase tracking-[0.2em] mt-10">Next Settlement: May 19, 2026</p>
              </Card>
            </div>

            {/* Invoices Preview */}
            <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-white overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-emerald-50/20">
                <div>
                  <h3 className="text-xl font-black text-[#0A2E1F] tracking-tight uppercase italic">Recent Settlement Log</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Data Matrix</p>
                </div>
                <Button variant="ghost" className="text-[10px] font-black uppercase italic tracking-widest text-emerald-600 hover:bg-emerald-600/10 gap-2 group">
                  View Full Ledger <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">ID</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger Entry</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Volume</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invoices.slice(0, 5).map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                        <td className="py-5 px-8 font-black text-[#0A2E1F] text-xs italic tracking-tight">{item.id}</td>
                        <td className="py-5 px-4 text-slate-600 text-xs font-bold uppercase">{item.plan}</td>
                        <td className="py-5 px-4 font-black text-[#0A2E1F] text-xs">{item.amount}</td>
                        <td className="py-5 px-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-5 px-8 text-slate-400 text-[10px] font-bold text-right">{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-10">
            {/* Billing Cycle Info */}
            <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-white p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-[#0A2E1F] tracking-tight uppercase">Billing Cycle</h3>
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              
              <div className="space-y-6">
                {[
                  { label: "Platform Fees", val: "$0.00", icon: ShieldCheck },
                  { label: "Shipping Costs", val: "$0.00", icon: Truck },
                  { label: "Clinical Costs", val: "$0.00", icon: Stethoscope },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                        <item.icon size={14} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                    </div>
                    <p className="text-xs font-black text-[#0A2E1F] italic">{item.val}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-3xl bg-[#0A2E1F]/5 border border-emerald-100/50">
                <p className="text-[10px] text-[#0A2E1F] font-bold leading-relaxed italic opacity-70">
                  Automatic settlement is triggered at $3,000.00 or upon reaching 250 ledger items.
                </p>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-white p-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-[#0A2E1F] tracking-tight uppercase">Settlement Method</h3>
                <CreditCard className="h-5 w-5 text-slate-400" />
              </div>
              
              <div className="p-6 rounded-[2rem] border border-emerald-100 bg-emerald-50/30 relative overflow-hidden group hover:bg-emerald-50/50 transition-all cursor-pointer">
                <div className="relative z-10 flex items-center gap-5">
                   <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-emerald-100">
                      <span className="font-black text-[#0A2E1F] text-xs italic">VISA</span>
                   </div>
                   <div>
                      <p className="text-sm font-black text-[#0A2E1F]">VISA ···· 2792</p>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Exp. 06/29 · Primary</p>
                   </div>
                </div>
              </div>
              
              <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0A2E1F]">
                Update Settlement Identity
              </Button>
            </Card>
          </div>

        </div>
      )}

      {/* Contract & Invoice sections would follow same luxury patterns */}
      {(activeTab === "Invoices" || activeTab === "Contracts") && (
        <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-white p-24 text-center">
           <div className="h-24 w-24 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
             <Columns className="h-10 w-10 text-slate-200" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Accessing Encrypted Records...</p>
        </Card>
      )}

    </div>
  );
}

