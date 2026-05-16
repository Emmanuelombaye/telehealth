import React, { useMemo, useState } from "react";
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { Card, cn } from "../shared";

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

export type AdminDataTableStatusTab = "all" | "active" | "inactive";

interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  /** Substring filter on normalized search text per row. Omit to disable search filtering. */
  getSearchText?: (item: T) => string;
  /** When set, All / Active / Inactive tabs filter rows. Omit to show only All (Active/Inactive hidden). */
  getStatusCategory?: (item: T) => "active" | "inactive";
  pageSize?: number;
  onRefresh?: () => void;
  rowKey?: (item: T, index: number) => React.Key;
  /** Copy visible (filtered) rows as TSV including header row. */
  getCopyTsvLine?: (item: T) => string;
}

export function AdminDataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onRowClick,
  getSearchText,
  getStatusCategory,
  pageSize = 10,
  onRefresh,
  rowKey,
  getCopyTsvLine,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<AdminDataTableStatusTab>("all");
  const [page, setPage] = useState(1);

  const searchNorm = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    let rows = data;
    if (getSearchText && searchNorm) {
      rows = rows.filter((item) => getSearchText(item).toLowerCase().includes(searchNorm));
    }
    if (getStatusCategory && statusTab !== "all") {
      rows = rows.filter((item) => {
        const cat = getStatusCategory(item);
        return statusTab === "active" ? cat === "active" : cat === "inactive";
      });
    }
    return rows;
  }, [data, getSearchText, getStatusCategory, searchNorm, statusTab]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);
  const rangeEnd = total === 0 ? 0 : Math.min(total, pageStart + pageRows.length);

  const resetFilters = () => {
    setSearch("");
    setStatusTab("all");
    setPage(1);
  };

  const tabClass = (tab: AdminDataTableStatusTab) =>
    cn(
      "text-[12px] font-medium border px-3 py-1.5 rounded-full transition-colors",
      statusTab === tab
        ? "border-border/80 bg-background text-foreground"
        : "border-transparent text-muted-foreground hover:bg-muted/50",
    );

  const copyVisibleTsv = async () => {
    if (!getCopyTsvLine) return;
    const header = columns.map((c) => c.header).join("\t");
    const body = filtered.map((item) => getCopyTsvLine(item)).join("\n");
    try {
      await navigator.clipboard.writeText([header, body].filter(Boolean).join("\n"));
    } catch {
      /* ignore */
    }
  };

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden bg-background font-sans">
      <div className="p-4 border-b border-border/60 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full border-none bg-transparent py-2 pl-9 pr-4 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/80 focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Copy table (TSV)"
              disabled={!getCopyTsvLine}
              onClick={() => void copyVisibleTsv()}
              className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground disabled:opacity-40"
            >
              <Copy className="h-[15px] w-[15px]" />
            </button>
            <button
              type="button"
              title="Refresh"
              onClick={() => {
                onRefresh?.();
                setPage(1);
              }}
              className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground"
            >
              <RefreshCw className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={tabClass("all")} onClick={() => { setStatusTab("all"); setPage(1); }}>
              All
            </button>
            {getStatusCategory ? (
              <>
                <button type="button" className={tabClass("active")} onClick={() => { setStatusTab("active"); setPage(1); }}>
                  Active
                </button>
                <button type="button" className={tabClass("inactive")} onClick={() => { setStatusTab("inactive"); setPage(1); }}>
                  Inactive
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border/80 rounded-full text-[12px] font-medium hover:bg-muted/50 transition-colors ml-0 sm:ml-2 text-muted-foreground"
              disabled
              title="Coming soon"
            >
              Extra Filters <Filter className="h-3 w-3 text-muted-foreground ml-1" />
            </button>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[12px] font-medium border border-border/80 bg-muted/20 px-4 py-1.5 rounded-full hover:bg-muted/50 transition-colors"
          >
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
            {pageRows.map((item, rowIdx) => (
              <tr
                key={rowKey ? rowKey(item, pageStart + rowIdx) : pageStart + rowIdx}
                className={cn(
                  "transition-all duration-300 group",
                  onRowClick
                    ? "cursor-pointer hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-transparent hover:shadow-[inset_4px_0_0_0_#10b981]"
                    : "hover:bg-muted/30",
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
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-muted-foreground text-sm">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
        <div>
          Rows per page: <span className="font-bold text-foreground">{pageSize}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            {total === 0 ? "0" : `${pageStart + 1}-${rangeEnd}`} of {total} items
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-40"
              disabled={safePage >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
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
