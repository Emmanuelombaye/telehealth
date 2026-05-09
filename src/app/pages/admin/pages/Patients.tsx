import { useState, useEffect } from "react";
import { Search, Printer, ArrowDownUp, CloudDownload, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { Card } from "../../../components/ui/shared.tsx";
import { AdminDataTable } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";

export function AdminPatientsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, order_number, patient_name, mrn, amount, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const uniquePatients: any[] = [];
        const seen = new Set();

        (data || []).forEach(order => {
          const pId = order.patient_name || order.id;
          if (!seen.has(pId)) {
            seen.add(pId);
            uniquePatients.push({
              id: order.id,
              name: order.patient_name || "New Patient",
              date: new Date(order.created_at).toLocaleDateString(),
              mrn: order.mrn || "Pending",
              subscription: typeof order.amount === 'number' ? `$${order.amount}` : order.amount || "$0",
              product: "Telehealth Visit"
            });
          }
        });

        setPatients(uniquePatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const columns = [
    { header: "Name", accessorKey: "name", cell: (item: any) => (
      <a href="#" className="font-semibold text-foreground hover:underline decoration-primary underline-offset-4">{item.name}</a>
    )},
    { header: "Start Date", accessorKey: "date" },
    { header: "MRN #", accessorKey: "mrn" },
    { header: "Subscription", accessorKey: "subscription" },
    { header: "Product Name", accessorKey: "product" },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-[1500px] mx-auto font-sans space-y-6">
      <h1 className="text-2xl font-semibold">Patients</h1>
      <AdminDataTable 
        data={patients} 
        columns={columns} 
        searchPlaceholder="Search by Patient ID, name, email, phone number, MRN#" 
      />
    </div>
  );
}

