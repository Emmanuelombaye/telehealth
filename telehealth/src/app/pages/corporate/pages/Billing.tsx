import { Receipt, CreditCard, Download, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared";

const invoices = [
  { id: "INV-2026-04", period: "April 2026", employees: 248, amount: "$12,400.00", due: "May 5, 2026", status: "due" },
  { id: "INV-2026-03", period: "March 2026", employees: 245, amount: "$12,250.00", due: "Apr 5, 2026", status: "paid" },
  { id: "INV-2026-02", period: "February 2026", employees: 240, amount: "$12,000.00", due: "Mar 5, 2026", status: "paid" },
  { id: "INV-2026-01", period: "January 2026", employees: 238, amount: "$11,900.00", due: "Feb 5, 2026", status: "paid" },
];

export function CorporateBillingPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-indigo-600" /> Billing & Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage your monthly subscription invoices and payment history.</p>
        </div>
        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700"><CreditCard className="h-4 w-4 mr-2" /> Update Payment</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2 border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-indigo-600 uppercase">Current Plan</p>
            <p className="text-2xl font-extrabold mt-1">Gold Enterprise</p>
            <p className="text-sm text-muted-foreground mt-1">248 seats · $50/seat/mo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase">Amount Due</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">$12,400.00</p>
            <p className="text-sm text-muted-foreground mt-1">Due May 5, 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase">YTD Spend</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">$48,550.00</p>
            <p className="text-sm text-muted-foreground mt-1">Across 4 months</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b pb-3"><CardTitle>Invoice History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>{["Invoice","Period","Employees","Amount","Due Date","Status","Action"].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-bold">{inv.id}</td>
                  <td className="px-5 py-3 font-semibold">{inv.period}</td>
                  <td className="px-5 py-3 text-muted-foreground">{inv.employees}</td>
                  <td className="px-5 py-3 font-bold">{inv.amount}</td>
                  <td className="px-5 py-3 text-muted-foreground">{inv.due}</td>
                  <td className="px-5 py-3">
                    {inv.status === "paid"
                      ? <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Paid</span>
                      : <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Due</span>}
                  </td>
                  <td className="px-5 py-3">
                    {inv.status === "paid"
                      ? <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Download className="h-3 w-3" /> PDF</Button>
                      : <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">Pay Now</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
