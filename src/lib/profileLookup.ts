import { supabase } from "./supabaseClient";

export type ProfileMini = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

/** Human-readable label from profile row, email, or short id. */
export function profileDisplayName(
  profile: Pick<ProfileMini, "full_name" | "email" | "role"> | null | undefined,
  fallbackId?: string,
): string {
  const name = profile?.full_name?.trim();
  if (name) return name;

  const email = profile?.email?.trim();
  if (email) {
    const local = email.split("@")[0] ?? email;
    return local
      .replace(/[._+-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  if (fallbackId) return `User ${fallbackId.slice(0, 8)}`;
  return "Unnamed user";
}

/** Best available patient label: order name → profile → email local-part → short id. */
export function resolvePatientDisplayName(opts: {
  userId?: string | null;
  orderPatientName?: string | null;
  profiles?: Map<string, ProfileMini>;
  orderNames?: Map<string, string>;
}): string {
  const trimmed = opts.orderPatientName?.trim();
  if (trimmed && !/^unknown(\s+patient)?$/i.test(trimmed)) return trimmed;

  const uid = opts.userId;
  if (uid) {
    const fromOrders = opts.orderNames?.get(uid)?.trim();
    if (fromOrders && !/^unknown(\s+patient)?$/i.test(fromOrders)) return fromOrders;

    const profile = opts.profiles?.get(uid);
    const fromProfile = profileDisplayName(profile, uid);
    if (fromProfile !== "Unnamed user") return fromProfile;
    return `Patient ${uid.slice(0, 8)}`;
  }

  return trimmed || "Unnamed patient";
}

export async function loadPatientNameContext(userIds: string[]) {
  const [profiles, orderNames] = await Promise.all([
    fetchProfilesByIds(userIds),
    fetchPatientNamesFromOrders(userIds),
  ]);
  return { profiles, orderNames };
}

export async function fetchProfilesByIds(ids: string[]): Promise<Map<string, ProfileMini>> {
  const map = new Map<string, ProfileMini>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return map;

  for (let i = 0; i < unique.length; i += 80) {
    const chunk = unique.slice(i, i + 80);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("id", chunk);
    if (error) {
      console.warn("[profiles]", error.message);
      break;
    }
    for (const row of data ?? []) {
      map.set(row.id, row as ProfileMini);
    }
  }

  return map;
}

/** Latest patient_name from orders for user ids (fallback when profile has no name). */
export async function fetchPatientNamesFromOrders(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return map;

  for (let i = 0; i < unique.length; i += 80) {
    const chunk = unique.slice(i, i + 80);
    const { data, error } = await supabase
      .from("orders")
      .select("user_id, patient_name, created_at")
      .in("user_id", chunk)
      .not("patient_name", "is", null)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[orders names]", error.message);
      break;
    }
    for (const row of data ?? []) {
      const uid = row.user_id as string | null;
      const name = (row.patient_name as string | null)?.trim();
      if (uid && name && !map.has(uid)) map.set(uid, name);
    }
  }

  return map;
}

export function resolveDisplayName(
  id: string,
  profiles: Map<string, ProfileMini>,
  orderNames?: Map<string, string>,
): string {
  const fromOrder = orderNames?.get(id);
  if (fromOrder?.trim()) return fromOrder.trim();
  return profileDisplayName(profiles.get(id), id);
}
