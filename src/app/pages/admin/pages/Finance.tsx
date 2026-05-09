import { useState, useEffect } from "react";
import { Download, CreditCard, ExternalLink, RefreshCw, Columns } from "lucide-react";
import { Card, Button } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";

const tabs = ["Overview", "Invoices", "Contracts"];
const invoiceFilters = ["All", "Paid", "Open", "Failed", "Processing", "Canceled"];

export function AdminFinancePage() {
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
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      <h1 className="text-2xl font-semibold">Finances · Billing</h1>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border/60 pb-[1px]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Current Plan */}
          <Card className="border-border/60 shadow-sm p-6">
            <h3 className="font-semibold mb-6">Current plan</h3>
            <h2 className="text-3xl font-bold mb-2">Enterprise</h2>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold">$4,499.99</span>
              <span className="text-muted-foreground font-medium">USD</span>
            </div>
            <span className="inline-block bg-muted px-2.5 py-1 rounded-md text-xs font-semibold mb-6">Monthly</span>
            
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Your monthly bill is on a 30-day cycle. It includes your Bask subscription, 3rd party charges, and transaction fees.
            </p>
            <p className="text-sm font-medium text-muted-foreground">Next payment on: May 19, 2026</p>
          </Card>

          {/* Billing Cycle */}
          <Card className="border-border/60 shadow-sm">
            <div className="p-6 border-b border-border/60">
              <h3 className="font-semibold">Billing Cycle</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Doctor Costs</p>
                <p className="text-xl font-bold">$0 <span className="text-sm font-medium text-muted-foreground">USD</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Shipping & Dispense Costs</p>
                <p className="text-xl font-bold">$0 <span className="text-sm font-medium text-muted-foreground">USD</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Platform Fees</p>
                <p className="text-xl font-bold">$0 <span className="text-sm font-medium text-muted-foreground">USD</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pharmacy Cost</p>
                <p className="text-xl font-bold">$0 <span className="text-sm font-medium text-muted-foreground">USD</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Other</p>
                <p className="text-xl font-bold">$0 <span className="text-sm font-medium text-muted-foreground">USD</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Credit Balance</p>
                <p className="text-xl font-bold">$0 <span className="text-sm font-medium text-muted-foreground">USD</span></p>
              </div>
            </div>
            <div className="p-4 bg-muted/20 border-t border-border/60">
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you reach <strong>$3,000.00</strong> in costs & fees before the end of your billing cycle or you reach 250 items on your invoice, a fee threshold bill will be issued automatically.
              </p>
            </div>
          </Card>

          {/* Payouts */}
          <Card className="border-border/60 shadow-sm p-6">
            <h3 className="font-semibold mb-6">Payouts</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                <p className="text-xl font-bold">$734.25 <span className="text-sm font-medium text-muted-foreground">USD</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available to Payout</p>
                <p className="text-xl font-bold">$734.25 <span className="text-sm font-medium text-muted-foreground">USD</span></p>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="border-border/60 shadow-sm">
            <div className="p-6 flex items-center justify-between border-b border-border/60">
              <h3 className="font-semibold">Payment Method</h3>
              <a href="#" className="text-sm font-medium underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">Update</a>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 border border-border/80 rounded-xl bg-muted/10">
                <div className="flex items-center gap-4">
                  <div className="bg-white px-3 py-1.5 border border-border rounded-md shadow-sm flex items-center justify-center">
                    <span className="font-bold text-blue-900 text-sm italic">VISA</span>
                  </div>
                  <div>
                    <p className="font-semibold">Visa <span className="text-muted-foreground font-normal">**** 2792</span></p>
                    <p className="text-xs text-muted-foreground">Exp. 06/29</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold">Primary</span>
              </div>
            </div>
          </Card>

        </div>
      )}

      {activeTab === "Invoices" && (
        <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
          <div className="p-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {invoiceFilters.map((filter) => (
                <button key={filter} className={`px-3 py-1.5 border rounded-lg text-[13px] font-medium transition-colors ${filter === "All" ? "bg-muted/50 border-border/80 text-foreground" : "border-border/40 text-muted-foreground hover:bg-muted/50"}`}>
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[13px] font-medium border border-border/80 bg-muted/20 px-4 py-1.5 rounded-full hover:bg-muted/50 transition-colors">Reset Filters</button>
              <button className="p-1.5 hover:bg-muted rounded-md transition-colors"><RefreshCw className="h-[18px] w-[18px] text-muted-foreground" /></button>
              <button className="p-1.5 hover:bg-muted rounded-md transition-colors"><Columns className="h-[18px] w-[18px] text-muted-foreground" /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/20 border-b border-border/60 text-muted-foreground text-[13px]">
                <tr>
                  <th className="font-medium py-3.5 px-6">Invoice number</th>
                  <th className="font-medium py-3.5 px-4">Plan</th>
                  <th className="font-medium py-3.5 px-4">Amount</th>
                  <th className="font-medium py-3.5 px-4">Status</th>
                  <th className="font-medium py-3.5 px-4">Method</th>
                  <th className="font-medium py-3.5 px-4">Paid at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {invoices.map((item, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-foreground">{item.id}</td>
                    <td className="py-4 px-4 text-foreground/80">{item.plan}</td>
                    <td className="py-4 px-4 font-medium">{item.amount}</td>
                    <td className="py-4 px-4">
                      {item.status === "Processing" ? (
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2.5 py-1 rounded-full text-[11px] font-bold border border-blue-200 dark:border-blue-800">Processing</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">Paid</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-foreground/80">{item.method}</td>
                    <td className="py-4 px-4 text-muted-foreground">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "Contracts" && (
        <Card className="border-border/60 shadow-sm bg-background min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No contracts found.</p>
        </Card>
      )}

    </div>
  );
}
