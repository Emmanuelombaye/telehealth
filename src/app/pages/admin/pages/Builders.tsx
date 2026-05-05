import { Search, Plus, Filter, Download, Upload, LayoutTemplate } from "lucide-react";
import { Card, Button } from "../../../components/ui/shared";

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

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border/60 pb-[1px]">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              tab === "All"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden bg-background min-h-[500px] flex flex-col">
        <div className="p-4 border-b border-border/60 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xl flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-[14px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border/80 rounded-full text-[13px] font-medium hover:bg-muted/50 transition-colors">
                Date <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border/80 rounded-full text-[13px] font-medium hover:bg-muted/50 transition-colors">
                Priority <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border/80 rounded-full text-[13px] font-medium hover:bg-muted/50 transition-colors">
                Type <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border/80 rounded-full text-[13px] font-medium hover:bg-muted/50 transition-colors">
                Category <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Your Landing Pages will appear here</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            You currently do not have any landing pages configured. Click the "Add New Page" button to start building your first page.
          </p>
        </div>
      </Card>
    </div>
  );
}
