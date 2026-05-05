import { Search, Printer, ArrowDownUp, Columns, CloudDownload, RefreshCw, ChevronDown } from "lucide-react";
import { Card } from "../../../components/ui/shared";

const mockTreatments = [
  { id: "1", name: "Ashley Shepherd", date: "05/02/2026", mrn: "P05626967", email: "ashepherd111@yahoo.com", phone: "(305) 304-9665", orders: "1" },
  { id: "2", name: "John Colvin", date: "05/01/2026", mrn: "Q13037761", email: "johncolvin1976@gmail.com", phone: "(734) 417-2550", orders: "1" },
  { id: "3", name: "Teresa Bakehorn", date: "05/01/2026", mrn: "R40900146", email: "teresabakehorn@yahoo.com", phone: "(765) 461-4340", orders: "1" },
  { id: "4", name: "Chelsea Callahan", date: "05/01/2026", mrn: "N11254965", email: "ccallahan0450@yahoo.com", phone: "(561) 213-0450", orders: "1" },
  { id: "5", name: "Jackie Webb", date: "04/27/2026", mrn: "W99586284", email: "jackielynnwebb@gmail.com", phone: "(269) 290-5187", orders: "1" },
];

export function AdminTreatmentsPage() {
  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      <h1 className="text-2xl font-semibold">Treatments</h1>

      <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
        <div className="p-4 border-b border-border/60 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-2xl flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, treatment ID, email, phone or MRN#"
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
              {[ "Refills", "Check-in status", "Visit status", "Treatment status", "Extra Filters"].map((filter) => (
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
                <th className="font-medium py-3.5 px-4">Start Date</th>
                <th className="font-medium py-3.5 px-4">MRN #</th>
                <th className="font-medium py-3.5 px-4">Email</th>
                <th className="font-medium py-3.5 px-4">Phone number</th>
                <th className="font-medium py-3.5 px-4">Order(s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mockTreatments.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="py-4 px-6">
                    <a href="#" className="font-medium underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-colors">
                      {item.name}
                    </a>
                  </td>
                  <td className="py-4 px-4 text-foreground/80">{item.date}</td>
                  <td className="py-4 px-4 text-foreground/80">{item.mrn}</td>
                  <td className="py-4 px-4 text-foreground/80">{item.email}</td>
                  <td className="py-4 px-4 text-foreground/80">{item.phone}</td>
                  <td className="py-4 px-4 text-foreground/80">{item.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
