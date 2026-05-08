import { useState } from "react";
import { Search, Printer, ArrowDownUp, CloudDownload, RefreshCw, ChevronDown } from "lucide-react";
import { Card } from "../../../components/ui/shared";
import { AdminDataTable } from "../../../components/ui/shared/AdminDataTable";

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

  const columns = [
    { header: "Name", accessorKey: "name", cell: (item: any) => (
      <a href="#" className="font-semibold text-foreground hover:underline decoration-primary underline-offset-4">{item.name}</a>
    )},
    { header: "Start Date", accessorKey: "date" },
    { header: "MRN #", accessorKey: "mrn" },
    { header: "Subscription", accessorKey: "subscription" },
    { header: "Product Name", accessorKey: "product" },
  ];

  return (
    <div className="max-w-[1500px] mx-auto font-sans space-y-6">
      <h1 className="text-2xl font-semibold">Patients</h1>
      <AdminDataTable 
        data={mockPatients} 
        columns={columns} 
        searchPlaceholder="Search by Patient ID, name, email, phone number, MRN#" 
      />
    </div>
  );
}
