import React from "react";
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Copy, GripVertical, FileText } from "lucide-react";
import { Card, cn } from "../shared";

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
}

export function AdminDataTable<T>({ 
  data, 
  columns, 
  searchPlaceholder = "Search...",
  onRowClick 
}: AdminDataTableProps<T>) {
  return (
    <Card className="border-border/60 shadow-sm overflow-hidden bg-background font-sans">
      <div className="p-4 border-b border-border/60 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full border-none bg-transparent py-2 pl-9 pr-4 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/80 focus:ring-0"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground">
              <Copy className="h-[15px] w-[15px]" />
            </button>
            <button className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground">
              <RefreshCw className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="text-[12px] font-medium border border-border/80 bg-background px-3 py-1.5 rounded-full hover:bg-muted/50 transition-colors text-foreground">
              All
            </button>
            <button className="text-[12px] font-medium border border-transparent px-3 py-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground">
              Active
            </button>
            <button className="text-[12px] font-medium border border-transparent px-3 py-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground">
              Inactive
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border/80 rounded-full text-[12px] font-medium hover:bg-muted/50 transition-colors ml-2">
              Extra Filters <Filter className="h-3 w-3 text-muted-foreground ml-1" />
            </button>
          </div>
          <button className="text-[12px] font-medium border border-border/80 bg-muted/20 px-4 py-1.5 rounded-full hover:bg-muted/50 transition-colors">
            Reset Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-muted/20 border-b border-border/60 text-muted-foreground text-[12px] uppercase tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="font-semibold py-3 px-5">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-[13px] text-foreground/90">
            {data.map((item, rowIdx) => (
              <tr 
                key={rowIdx} 
                className={cn(
                  "hover:bg-muted/30 transition-colors group", 
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="py-3.5 px-5">
                    {col.cell ? col.cell(item) : String((item as any)[col.accessorKey] || "-")}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-muted-foreground text-sm">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-border/60 flex items-center justify-between text-[12px] text-muted-foreground">
        <div>
          Rows per page: <span className="font-bold text-foreground">10</span>
        </div>
        <div className="flex items-center gap-4">
          <span>1-10 of 28 items</span>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-muted rounded transition-colors"><ChevronLeft className="h-4 w-4" /></button>
            <button className="p-1 hover:bg-muted rounded transition-colors"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Reusable Badges for Classic Table
export function StatusText({ status }: { status: string }) {
  const isGreen = ["Approved", "Live", "Active", "Paid"].includes(status);
  const isBlue = ["Draft", "Pending"].includes(status);
  const isOrange = ["Test", "Inactive"].includes(status);
  const isRed = ["Canceled", "Error", "Failed"].includes(status);

  return (
    <span className={cn(
      "font-medium text-[12px]",
      isGreen && "text-emerald-600 dark:text-emerald-500",
      isBlue && "text-blue-600 dark:text-blue-500",
      isOrange && "text-orange-500 dark:text-orange-400",
      isRed && "text-red-600 dark:text-red-500",
      !isGreen && !isBlue && !isOrange && !isRed && "text-muted-foreground"
    )}>
      {status}
    </span>
  );
}

export function ActionBadge({ label, variant }: { label: string, variant: "blue" | "red" | "gray" }) {
  if (variant === "blue") {
    return (
      <button className="bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded transition-colors" onClick={(e) => e.stopPropagation()}>
        {label}
      </button>
    );
  }
  if (variant === "red") {
    return (
      <button className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors dark:border-red-900/50 dark:bg-red-950/30" onClick={(e) => e.stopPropagation()}>
        {label}
      </button>
    );
  }
  return (
    <button className="border border-border bg-muted/50 text-foreground text-[11px] font-semibold px-2.5 py-1 rounded hover:bg-muted transition-colors" onClick={(e) => e.stopPropagation()}>
      {label}
    </button>
  );
}
