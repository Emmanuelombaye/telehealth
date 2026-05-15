import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { Search, Printer, ArrowDownUp, CloudDownload, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { Card } from "../../../components/ui/shared.tsx";
import { AdminDataTable } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT, applyOrdersBrandScope } from "../../../../lib/adminScope";
import { AdminScopeNotice } from "../../../components/admin/AdminScopeNotice.tsx";

export function AdminPatientsPage() {
  const location = useLocation();
  const scopeVariant = location.pathname.startsWith("/superadmin") ? "platform" : "brand";
  const role = useAuthStore((s) => s.role);
  const brandId = useAuthStore((s) => s.brandId);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatients() {
      try {
        let q = supabase
          .from('orders')
          .select(ORDERS_ADMIN_NON_CLINICAL_SELECT)
          .order('created_at', { ascending: false });
        q = applyOrdersBrandScope(q, role, brandId);
        const { data, error } = await q;

        if (error) throw error;

        const uniquePatients: any[] = [];
        const seen = new Set();

        (data || []).forEach((order: Record<string, any>) => {
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
              product: "Telehealth Visit",
              email: order.patient_email || "—",
              brand: order.sub_brand || "—",
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
      <span className="font-semibold text-foreground">{item.name}</span>
    )},
    ...(scopeVariant === "platform"
      ? [{ header: "Brand", accessorKey: "brand" } as const]
      : []),
    { header: "Email (ops)", accessorKey: "email", cell: (item: any) => (
      <span className="text-sm text-muted-foreground">{item.email}</span>
    )},
    { header: "Start date", accessorKey: "date" },
    { header: "MRN", accessorKey: "mrn" },
    { header: "Paid (order)", accessorKey: "subscription" },
    { header: "Product", accessorKey: "product" },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-[1500px] mx-auto font-sans space-y-6">
      <AdminScopeNotice variant={scopeVariant} />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {scopeVariant === "platform" ? "Global patient overview (non-clinical)" : "Patients (non-clinical)"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Derived from operational orders — contact and identifiers only. Chart notes, intake answers,
            prescriptions, and provider decisions are routed through clinical portals.
          </p>
        </div>
      </div>
      <AdminDataTable 
        data={patients} 
        columns={columns} 
        searchPlaceholder="Search patient name, MRN, brand, email…" 
      />
    </div>
  );
}

