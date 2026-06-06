import { supabase } from "./supabaseClient";
import { isMissingColumnError } from "./supabaseTableError";

const MESSAGE_SELECT = "id, content, created_at, sender_id, receiver_id, is_read";

/** Count unread messages for the current user; falls back when is_read column is missing. */
export async function countUnreadMessages(userId: string) {
  let { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("is_read", false);

  if (error && isMissingColumnError(error)) {
    ({ count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("read", false));
  }

  return { count: count ?? 0, error };
}

/** Load thread messages with is_read normalized from legacy `read` column. */
export async function fetchMessages(opts: {
  userId: string;
  orderId?: string;
}) {
  let query = supabase.from("messages").select(MESSAGE_SELECT).order("created_at", { ascending: true });

  if (opts.orderId) {
    query = query.eq("order_id", opts.orderId);
  } else {
    query = query.or(`sender_id.eq.${opts.userId},receiver_id.eq.${opts.userId}`);
  }

  let { data, error } = await query;

  if (error && isMissingColumnError(error)) {
    let legacyQuery = supabase
      .from("messages")
      .select("id, content, created_at, sender_id, receiver_id, read")
      .order("created_at", { ascending: true });
    if (opts.orderId) {
      legacyQuery = legacyQuery.eq("order_id", opts.orderId);
    } else {
      legacyQuery = legacyQuery.or(`sender_id.eq.${opts.userId},receiver_id.eq.${opts.userId}`);
    }
    const legacy = await legacyQuery;
    data = (legacy.data ?? []).map((row) => ({
      ...row,
      is_read: Boolean((row as { read?: boolean }).read),
    }));
    error = legacy.error;
  }

  return { data: data ?? [], error };
}

/** Mark messages read — tries is_read then legacy read column. */
export async function markMessagesRead(ids: string[]) {
  if (!ids.length) return { error: null };

  let { error } = await supabase.from("messages").update({ is_read: true }).in("id", ids);

  if (error && isMissingColumnError(error)) {
    ({ error } = await supabase.from("messages").update({ read: true }).in("id", ids));
  }

  return { error };
}
