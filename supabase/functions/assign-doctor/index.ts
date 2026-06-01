import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { order_id, patient_state } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Find eligible doctors (licensed in state, active status)
    // We fetch them and sort by patient_count to balance load
    const { data: doctors, error: docError } = await supabase
      .from('profiles')
      .select('id, full_name, patients_count, licensed_states')
      .eq('role', 'doctor')
      .eq('status', 'active')
      .order('patients_count', { ascending: true });

    if (docError) throw docError;

    // 2. Filter for state licensing (case-insensitive)
    const assignedDoctor = doctors.find(d => 
      d.licensed_states?.split(',').map((s: string) => s.trim().toUpperCase())
        .includes(patient_state?.toUpperCase())
    );

    if (!assignedDoctor) {
      console.warn(`No licensed doctor found for state: ${patient_state}. Flagging for manual admin assignment.`);
      return jsonResponse({ error: "No eligible doctor found" }, 404);
    }

    // 3. Assign doctor to order
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        doctor_id: assignedDoctor.id,
        doctor: assignedDoctor.full_name,
        status: 'medical_review' // Move to review stage now that doctor is assigned
      })
      .eq('id', order_id);

    if (updateError) throw updateError;

    // 4. Increment doctor's patient count
    await supabase.rpc('increment_patients_count', { doctor_id: assignedDoctor.id });

    return jsonResponse({ 
      success: true, 
      doctor_id: assignedDoctor.id, 
      doctor_name: assignedDoctor.full_name 
    });

  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
