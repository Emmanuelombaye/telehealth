import { supabase } from "./supabaseClient";
import { isMissingColumnError } from "./supabaseTableError";
import {
  fetchPatientNamesFromOrders,
  fetchProfilesByIds,
  resolveDisplayName,
  type ProfileMini,
} from "./profileLookup";
import type { RawMessageRow } from "./doctorMessages";

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

type MessageRow = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
};

function attachProfilesToMessages(
  rows: MessageRow[],
  profiles: Map<string, ProfileMini>,
  orderNames: Map<string, string>,
): RawMessageRow[] {
  return rows.map((row) => {
    const senderProfile = profiles.get(row.sender_id);
    const receiverProfile = profiles.get(row.receiver_id);
    return {
      ...row,
      sender: senderProfile
        ? {
            id: row.sender_id,
            full_name: resolveDisplayName(row.sender_id, profiles, orderNames),
            role: senderProfile.role,
          }
        : {
            id: row.sender_id,
            full_name: resolveDisplayName(row.sender_id, profiles, orderNames),
            role: null,
          },
      receiver: receiverProfile
        ? {
            id: row.receiver_id,
            full_name: resolveDisplayName(row.receiver_id, profiles, orderNames),
            role: receiverProfile.role,
          }
        : {
            id: row.receiver_id,
            full_name: resolveDisplayName(row.receiver_id, profiles, orderNames),
            role: null,
          },
    };
  });
}

/** Load messages without PostgREST FK joins — enriches sender/receiver from profiles + orders. */
export async function fetchMessagesWithProfiles(opts: {
  orFilter?: string;
  limit?: number;
  ascending?: boolean;
}) {
  let query = supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .order("created_at", { ascending: opts.ascending ?? true });

  if (opts.orFilter) query = query.or(opts.orFilter);
  if (opts.limit) query = query.limit(opts.limit);

  let { data, error } = await query;

  if (error && isMissingColumnError(error)) {
    let legacy = supabase
      .from("messages")
      .select("id, content, created_at, sender_id, receiver_id, read")
      .order("created_at", { ascending: opts.ascending ?? true });
    if (opts.orFilter) legacy = legacy.or(opts.orFilter);
    if (opts.limit) legacy = legacy.limit(opts.limit);
    const res = await legacy;
    data = (res.data ?? []).map((row) => ({
      ...row,
      is_read: Boolean((row as { read?: boolean }).read),
    }));
    error = res.error;
  }

  const rows = (data ?? []) as MessageRow[];
  if (error) return { data: [] as RawMessageRow[], error };

  const ids = rows.flatMap((r) => [r.sender_id, r.receiver_id]);
  const [profiles, orderNames] = await Promise.all([fetchProfilesByIds(ids), fetchPatientNamesFromOrders(ids)]);

  return { data: attachProfilesToMessages(rows, profiles, orderNames), error: null };
}
