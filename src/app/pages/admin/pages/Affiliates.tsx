import { Share2, Plus, TrendingUp, DollarSign, Users, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";
import { AdminDataTable, StatusText } from "../../../components/ui/shared/AdminDataTable";

const affiliates = [
  { id: 1, name: "HealthBlog Pro", contact: "sarah@healthblog.com", referrals: 234, revenue: "$4,680", commission: "$468", rate: "10%", status: "active" },
  { id: 2, name: "MedInfluencer Network", contact: "team@medinfl.com", referrals: 189, revenue: "$3,780", commission: "$567", rate: "15%", status: "active" },
  { id: 3, name: "Corporate Wellness Co.", contact: "hr@corpwellness.com", referrals: 98, revenue: "$9,800", commission: "$980", rate: "10%", status: "active" },
  { id: 4, name: "FitLife Magazine", contact: "ads@fitlife.com", referrals: 12, revenue: "$240", commission: "$24", rate: "10%", status: "inactive" },
];

export function AdminAffiliatesPage() {
  return (
    <div className="max-w-[1500px] mx-auto font-sans space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Affiliates</h1>
        <Button size="sm" className="rounded-lg gap-1.5 h-9 px-4 text-[13px] bg-primary hover:bg-primary/90 text-white"><Plus className="h-4 w-4" /> Add Partner</Button>
      </div>

      <AdminDataTable 
        data={affiliates} 
        columns={[
          { header: "Partner", accessorKey: "name", cell: (item: any) => (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                {item.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.contact}</span>
              </div>
            </div>
          )},
          { header: "Referrals", accessorKey: "referrals", cell: (item: any) => <span className="font-medium">{item.referrals}</span> },
          { header: "Revenue", accessorKey: "revenue", cell: (item: any) => <span className="text-emerald-600 font-semibold">{item.revenue}</span> },
          { header: "Commission", accessorKey: "commission", cell: (item: any) => (
            <span className="text-amber-600 font-semibold">{item.commission} <span className="text-muted-foreground font-normal text-xs">({item.rate})</span></span>
          )},
          { header: "Status", accessorKey: "status", cell: (item: any) => <StatusText status={item.status === "active" ? "Active" : "Archived"} /> },
          { header: "Actions", accessorKey: "actions", cell: (item: any) => (
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Copy className="h-4 w-4" /></button>
              <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><ExternalLink className="h-4 w-4" /></button>
            </div>
          )}
        ]} 
        searchPlaceholder="Search affiliates by name or email" 
      />
    </div>
  );
}
