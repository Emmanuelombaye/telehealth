import { Search, Printer, ArrowDownUp, Columns, CloudDownload, RefreshCw, ChevronDown } from "lucide-react";
import { Card } from "../../../components/ui/shared";

const mockOrders = [
  { id: "1", name: "Louis Della Badia", pharmacy: "VialsRX", date: "05/03/2026", mrn: "D31118621", status: "Succeeded" },
  { id: "2", name: "Erin Kneer", pharmacy: "VialsRX", date: "05/02/2026", mrn: "S43385633", status: "Succeeded" },
  { id: "3", name: "Ashley Shepherd", pharmacy: "VialsRX", date: "05/02/2026", mrn: "P05626967", status: "Succeeded" },
  { id: "4", name: "Kyler Douglas", pharmacy: "VialsRX", date: "05/02/2026", mrn: "A31393595", status: "Partial Refund" },
  { id: "5", name: "John Colvin", pharmacy: "VialsRX", date: "05/01/2026", mrn: "Q13037761", status: "Succeeded" },
  { id: "6", name: "Teresa Bakehorn", pharmacy: "VialsRX", date: "05/01/2026", mrn: "R40900146", status: "Succeeded" },
  { id: "7", name: "Chelsea Callahan", pharmacy: "VialsRX", date: "05/01/2026", mrn: "N11254965", status: "Succeeded" },
  { id: "8", name: "Jackie Webb", pharmacy: "VialsRX", date: "04/27/2026", mrn: "W99586284", status: "Failed" },
];

const statusStyles: Record<string, string> = {
  "Succeeded": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  "Partial Refund": "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  "Failed": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800"
};

export function AdminOrdersPage() {
  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
        <div className="p-4 border-b border-border/60 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-2xl flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by order number, affiliate order number, MRN, patient name, phone number, or id"
                className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-[14px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><Printer className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><ArrowDownUp className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><Columns className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><CloudDownload className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><RefreshCw className="h-[18px] w-[18px]" /></button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {[ "Payment Status", "Visit Status", "Order Status", "Product", "Pharmacies", "Pharmacy Status", "Extra Filters"].map((filter) => (
                <button key={filter} className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border/80 rounded-full text-[13px] font-medium hover:bg-muted/50 transition-colors">
                  {filter} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
            <button className="text-[13px] font-medium border border-border/80 bg-muted/20 px-4 py-1.5 rounded-full hover:bg-muted/50 transition-colors">
              Reset Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/20 border-b border-border/60 text-muted-foreground text-[13px]">
              <tr>
                <th className="font-medium py-3.5 px-6">Name</th>
                <th className="font-medium py-3.5 px-4">Pharmacy</th>
                <th className="font-medium py-3.5 px-4">Order Date</th>
                <th className="font-medium py-3.5 px-4">MRN #</th>
                <th className="font-medium py-3.5 px-4">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mockOrders.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="py-4 px-6">
                    <a href="#" className="font-medium underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-colors">
                      {item.name}
                    </a>
                  </td>
                  <td className="py-4 px-4 text-foreground/80">{item.pharmacy}</td>
                  <td className="py-4 px-4 text-foreground/80">{item.date}</td>
                  <td className="py-4 px-4 text-foreground/80">{item.mrn}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusStyles[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
