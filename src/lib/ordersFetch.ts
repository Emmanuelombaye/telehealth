import { supabase } from "./supabaseClient";
import type { Role } from "./auth-store";
import {
  applyOrdersBrandScope,
  ordersSelectForMode,
  resolveOrdersFetchMode,
  type OrdersFetchMode,
} from "./adminScope";
import { isMissingColumnError } from "./supabaseTableError";

export function orderRefFromRow(row: Record<string, unknown>): string {
  const explicit = row.order_number;
  if (explicit != null && String(explicit).trim() !== "") return String(explicit);
  const id = row.id;
  if (typeof id === "string" && id.length >= 8) return id.slice(0, 8).toUpperCase();
  return String(id ?? "unknown");
}

/** Load orders; falls back to `select('*')` when explicit columns are missing on the DB. */
export async function fetchOrdersRows(
  role: Role | null,
  brandId: string | null,
  userId: string | undefined,
  limit?: number,
) {
  const mode = resolveOrdersFetchMode(role);
  const primarySelect = ordersSelectForMode(mode);

  const run = async (selectCols: string) => {
    if (limit != null) {
      let query = supabase.from("orders").select(selectCols).order("created_at", { ascending: false });
      if (role === "patient" && userId) {
        query = query.eq("user_id", userId);
      } else {
        query = applyOrdersBrandScope(query, role, brandId);
      }
      query = query.limit(limit);
      return query;
    }

    let allData: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    
    while (true) {
      let query = supabase
        .from("orders")
        .select(selectCols)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (role === "patient" && userId) {
        query = query.eq("user_id", userId);
      } else {
        query = applyOrdersBrandScope(query, role, brandId);
      }

      const { data, error } = await query;
      if (error) return { data: null, error };
      if (!data || data.length === 0) break;
      
      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) break;
      page++;
    }
    
    return { data: allData, error: null };
  };

  let { data, error } = await run(primarySelect);

  if (error && isMissingColumnError(error) && primarySelect !== "*") {
    ({ data, error } = await run("*"));
  }

  return {
    data: (data ?? []) as Record<string, unknown>[],
    error,
  };
}

export { type OrdersFetchMode };
