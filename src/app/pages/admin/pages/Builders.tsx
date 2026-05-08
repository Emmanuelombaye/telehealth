import { Plus, Download, Upload } from "lucide-react";
import { Button } from "../../../components/ui/shared.tsx";
import { AdminDataTable } from "../../../components/ui/tables/AdminDataTable";

const tabs = ["All", "Active", "Unactive"];

export function AdminBuildersPage() {
  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Landing pages</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-lg gap-2">
            <Download className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" className="rounded-lg gap-2">
            <Upload className="h-4 w-4" /> Export
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-2">
            <Plus className="h-4 w-4" /> Add New Page
          </Button>
        </div>
      </div>

      <AdminDataTable 
        data={[]} 
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "URL", accessorKey: "url" },
          { header: "Status", accessorKey: "status" },
          { header: "Last Updated", accessorKey: "updated" }
        ]} 
        searchPlaceholder="Search landing pages" 
      />
    </div>
  );
}
