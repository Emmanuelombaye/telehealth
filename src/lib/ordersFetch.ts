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
    let query = supabase.from("orders").select(selectCols).order("created_at", { ascending: false });

    if (role === "patient" && userId) {
      query = query.eq("user_id", userId);
    } else {
      query = applyOrdersBrandScope(query, role, brandId);
    }

    if (limit != null) query = query.limit(limit);

    return query;
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
