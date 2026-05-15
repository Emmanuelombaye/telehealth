import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
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
      return new Response(JSON.stringify({ error: "No eligible doctor found" }), { status: 404 });
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

    return new Response(JSON.stringify({ 
      success: true, 
      doctor_id: assignedDoctor.id, 
      doctor_name: assignedDoctor.full_name 
    }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
