import { useState } from "react";
import { Search, Printer, ArrowDownUp, CloudDownload, RefreshCw, ChevronDown } from "lucide-react";
import { Card } from "../../../components/ui/shared";

// Mock Data from Bask Health Screenshot
const mockPatients = [
  { id: "1", name: "Arista Steyn", date: "05/05/2026", mrn: "E96722429", subscription: "$0", product: "N/A" },
  { id: "2", name: "Lynda Ellison", date: "05/05/2026", mrn: "R11263215", subscription: "$0", product: "N/A" },
  { id: "3", name: "Joyce Robertson", date: "05/05/2026", mrn: "I75373261", subscription: "$0", product: "N/A" },
  { id: "4", name: "Cheryl Gaspard", date: "05/05/2026", mrn: "Z45572227", subscription: "$0", product: "N/A" },
  { id: "5", name: "John Morgan", date: "05/05/2026", mrn: "S09023269", subscription: "$0", product: "N/A" },
  { id: "6", name: "Michelle Sault", date: "05/05/2026", mrn: "S20564877", subscription: "$0", product: "N/A" },
  { id: "7", name: "Marlene Ponce", date: "05/04/2026", mrn: "O26118938", subscription: "$0", product: "N/A" },
  { id: "8", name: "Skillatria User", date: "05/04/2026", mrn: "Y86920229", subscription: "$0", product: "N/A" },
  { id: "9", name: "Misanly Marquez Ortiz", date: "05/04/2026", mrn: "K35472620", subscription: "$0", product: "N/A" },
  { id: "10", name: "Tiffany Morris", date: "05/04/2026", mrn: "Y70564083", subscription: "$0", product: "N/A" },
];

const tabs = ["All", "Active", "Pending", "Abandoned", "Canceled"];

export function AdminPatientsPage() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      <h1 className="text-2xl font-semibold">Patients</h1>

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

      {/* Main Table Container */}
      <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
        
        {/* Toolbar Area */}
        <div className="p-4 border-b border-border/60 space-y-4">
          
          {/* Top Toolbar Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-2xl flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Patient ID, name, email, phone number, MRN#"
                className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-[14px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><Printer className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><ArrowDownUp className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><CloudDownload className="h-[18px] w-[18px]" /></button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors"><RefreshCw className="h-[18px] w-[18px]" /></button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {[ "Refills", "Visit status", "Patient status", "Extra Filters"].map((filter) => (
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

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/20 border-b border-border/60 text-muted-foreground text-[13px]">
              <tr>
                <th className="font-medium py-3.5 px-6 w-[25%]">Name</th>
                <th className="font-medium py-3.5 px-4 w-[15%]">Start Date</th>
                <th className="font-medium py-3.5 px-4 w-[20%]">MRN #</th>
                <th className="font-medium py-3.5 px-4 w-[15%]">Subscription</th>
                <th className="font-medium py-3.5 px-4 w-[25%]">Product Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mockPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="py-4 px-6">
                    <a href="#" className="font-medium underline underline-offset-4 decoration-border group-hover:decoration-foreground transition-colors">
                      {patient.name}
                    </a>
                  </td>
                  <td className="py-4 px-4 text-foreground/80">{patient.date}</td>
                  <td className="py-4 px-4 text-foreground/80">{patient.mrn}</td>
                  <td className="py-4 px-4 text-foreground/80">{patient.subscription}</td>
                  <td className="py-4 px-4 text-foreground/80">{patient.product}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
