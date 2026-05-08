import { Card } from "../../../components/ui/shared.tsx";
import { AdminDataTable } from "../../../components/ui/tables/AdminDataTable";

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

      <AdminDataTable 
        data={mockTreatments} 
        columns={[
          { header: "Name", accessorKey: "name", cell: (item: any) => (
            <a href="#" className="font-semibold text-foreground hover:underline decoration-primary underline-offset-4">{item.name}</a>
          )},
          { header: "Start Date", accessorKey: "date" },
          { header: "MRN #", accessorKey: "mrn" },
          { header: "Email", accessorKey: "email" },
          { header: "Phone number", accessorKey: "phone" },
          { header: "Order(s)", accessorKey: "orders" }
        ]} 
        searchPlaceholder="Search by name, treatment ID, email, phone or MRN#" 
      />
    </div>
  );
}
