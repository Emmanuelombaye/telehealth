import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "../../../components/ui/shared.tsx";
import { AdminDataTable } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";

export function AdminTreatmentsPage() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTreatments() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, patient_name, mrn, category, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const uniqueTreatments: any[] = [];
        const seen = new Set();

        (data || []).forEach(order => {
          const pId = order.patient_name || order.id;
          if (!seen.has(pId)) {
            seen.add(pId);
            uniqueTreatments.push({
              id: order.id,
              name: order.patient_name || "New Patient",
              date: new Date(order.created_at).toLocaleDateString(),
              mrn: order.mrn || "Pending",
              email: "Secure Record",
              phone: "Secure Record",
              orders: "1"
            });
          }
        });

        setTreatments(uniqueTreatments);
      } catch (err) {
        console.error("Error fetching treatments:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTreatments();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      <h1 className="text-2xl font-semibold">Treatments</h1>

      <AdminDataTable 
        data={treatments} 
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

