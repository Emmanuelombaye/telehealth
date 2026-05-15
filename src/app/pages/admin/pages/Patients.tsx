import { useState, useEffect } from "react";
import { Search, Printer, ArrowDownUp, CloudDownload, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { Card } from "../../../components/ui/shared.tsx";
import { AdminDataTable } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT, applyOrdersBrandScope } from "../../../../lib/adminScope";

export function AdminPatientsPage() {
  const role = useAuthStore((s) => s.role);
  const brandId = useAuthStore((s) => s.brandId);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        let q = supabase
          .from('orders')
          .select('id, order_number, patient_name, mrn, amount, created_at, sub_brand')
          .order('created_at', { ascending: false });
        q = applyOrdersBrandScope(q, role, brandId);
        const { data, error } = await q;

        if (error) throw error;

        const uniquePatients: any[] = [];
        const seen = new Set();

        (data || []).forEach(order => {
          const pId = order.patient_name || order.id;
          if (!seen.has(pId)) {
            seen.add(pId);
            const d = new Date(order.created_at);
            const dateStr = isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
            uniquePatients.push({
              id: order.id,
              name: order.patient_name || "New Patient",
              date: dateStr,
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
  }, [role, brandId]);

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

