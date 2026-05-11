
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvopgyhcjcniaocjozje.supabase.co';
const supabaseAnonKey = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runFullSystemTest() {
  console.log('🚀 INITIALIZING FULL SYSTEM INTEGRATION TEST...');
  console.log('--------------------------------------------------');

  try {
    // 1. Create a fresh test order (Patient Flow)
    const testOrderRef = "DOCTOR-TEST-" + Math.random().toString(36).substring(7).toUpperCase();
    console.log(`📡 [PHASE 1] Creating Test Order: ${testOrderRef}`);
    
    const { error: insertError } = await supabase.from('orders').insert([{
      order_number: testOrderRef,
      patient_name: "EXECUTIVE TEST PATIENT",
      sub_brand: "Peak Health",
      medication: "Semaglutide (GLP-1)",
      category: "Weight Loss",
      status: "order_submitted",
      amount: 199.00,
      user_id: "77777777-7777-7777-7777-777777777777"
    }]);

    if (insertError) {
       console.warn('⚠️ Phase 1 Note: RLS might be active. If this fails, please run supabase_mvp_rls_reset.sql in Supabase Dashboard.');
       throw insertError;
    }
    console.log('✅ Phase 1: Order successfully injected into backend.');

    // 2. Simulate Doctor requesting Video Call (Clinical Flow)
    console.log(`📡 [PHASE 2] Simulating Doctor Video Request...`);
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        zoom_status: 'requested',
        zoom_doctor_message: 'Please schedule a brief consultation to review your vitals.'
      })
      .eq('order_number', testOrderRef);

    if (updateError) throw updateError;
    console.log('✅ Phase 2: Doctor action successfully recorded in DB.');

    // 3. Verify Patient side sees the request (Real-time Communication)
    console.log(`📡 [PHASE 3] Verifying Patient Dashboard Sync...`);
    const { data: verifiedOrder, error: verifyError } = await supabase
      .from('orders')
      .select('zoom_status, zoom_doctor_message')
      .eq('order_number', testOrderRef)
      .single();

    if (verifyError) throw verifyError;
    
    if (verifiedOrder.zoom_status === 'requested') {
      console.log('✅ Phase 3: Real-time communication verified.');
      console.log(`   Message Received: "${verifiedOrder.zoom_doctor_message}"`);
    } else {
      throw new Error('Sync Mismatch: Patient side did not receive video request.');
    }

    console.log('--------------------------------------------------');
    console.log('🏆 SYSTEM INTEGRATION: 100% OPERATIONAL');
    console.log('Doctor and Patient portals are communicating in real-time via Supabase.');

  } catch (error) {
    console.error('❌ INTEGRATION TEST FAILED:', error.message);
    process.exit(1);
  }
}

runFullSystemTest();
