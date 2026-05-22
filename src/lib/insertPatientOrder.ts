import type { PostgrestError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const VIDEO_ROUTING_KEYS = ["requires_sync_video", "video_routing_reasons"] as const;

function missingColumnFromMessage(message: string): string | null {
  const m = message.match(/Could not find the '([^']+)' column/i);
  return m?.[1] ?? null;
}

function stripKeys(payload: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const next = { ...payload };
  for (const k of keys) delete next[k];
  return next;
}

/**
 * Insert enrollment order, retrying without columns missing from the live schema.
 */
export async function insertPatientOrder(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<{ error: PostgrestError | null }> {
  let current = { ...payload };
  let lastError: PostgrestError | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const { error } = await supabase.from("orders").insert([current]);
    if (!error) return { error: null };
    lastError = error;
    const msg = error.message ?? "";

    if (VIDEO_ROUTING_KEYS.some((k) => msg.includes(k))) {
      current = stripKeys(current, [...VIDEO_ROUTING_KEYS]);
      continue;
    }

    const missing = missingColumnFromMessage(msg);
    if (missing) {
      current = stripKeys(current, [missing]);
      continue;
    }

    break;
  }

  return { error: lastError };
}
