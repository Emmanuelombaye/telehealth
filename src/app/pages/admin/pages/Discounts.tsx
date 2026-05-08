import { Plus, Copy, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button, Badge } from "../../../components/ui/shared";
import { AdminDataTable, StatusText } from "../../../components/ui/shared/AdminDataTable";
import { useState } from "react";

const discounts = [
  { id: 1, code: "WELCOME20", type: "Percentage", value: "20%", uses: 340, limit: 500, expires: "Jun 30, 2026", active: true },
  { id: 2, code: "FIRSTVISIT", type: "Fixed", value: "$25 off", uses: 1200, limit: null, expires: "Dec 31, 2026", active: true },
  { id: 3, code: "SUMMER10", type: "Percentage", value: "10%", uses: 89, limit: 200, expires: "Aug 31, 2026", active: true },
  { id: 4, code: "EXPIRED50", type: "Percentage", value: "50%", uses: 45, limit: 50, expires: "Apr 1, 2026", active: false },
];

export function AdminDiscountsPage() {
  const [states, setStates] = useState<Record<number, boolean>>(Object.fromEntries(discounts.map(d => [d.id, d.active])));

  return (
    <div className="max-w-[1500px] mx-auto font-sans space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Discounts</h1>
        <Button size="sm" className="rounded-lg gap-1.5 h-9 px-4 text-[13px] bg-primary hover:bg-primary/90 text-white"><Plus className="h-4 w-4" /> Create Code</Button>
      </div>
      
      <AdminDataTable 
        data={discounts} 
        columns={[
          { header: "Code", accessorKey: "code", cell: (item: any) => (
            <code className="font-bold text-sm bg-muted px-2.5 py-1 rounded-md">{item.code}</code>
          )},
          { header: "Type", accessorKey: "type", cell: (item: any) => <Badge variant="outline" className="text-[10px]">{item.type}</Badge> },
          { header: "Value", accessorKey: "value", cell: (item: any) => <span className="font-bold text-primary">{item.value}</span> },
          { header: "Usage", accessorKey: "uses", cell: (item: any) => (
            <div className="flex flex-col gap-1 w-32">
              <span className="text-xs text-muted-foreground">{item.uses} / {item.limit || "∞"} used</span>
              {item.limit && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(item.uses / item.limit) * 100}%` }} />
                </div>
              )}
            </div>
          )},
          { header: "Expires", accessorKey: "expires" },
          { header: "Status", accessorKey: "active", cell: (item: any) => <StatusText status={states[item.id] ? "Active" : "Archived"} /> },
          { header: "Actions", accessorKey: "actions", cell: (item: any) => (
            <div className="flex items-center gap-2">
              <button onClick={() => navigator.clipboard?.writeText(item.code)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Copy className="h-4 w-4" /></button>
              <button onClick={() => setStates(s => ({ ...s, [item.id]: !s[item.id] }))}>
                {states[item.id] ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
              </button>
              <button className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        ]} 
        searchPlaceholder="Search discount codes" 
      />
    </div>
  );
}
