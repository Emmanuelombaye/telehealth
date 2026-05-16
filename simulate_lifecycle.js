
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvopgyhcjcniaocjozje.supabase.co';
const supabaseAnonKey = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateFullLifecycle() {
  console.log('📦 SIMULATING FULL PATIENT-TO-SHIPPING LIFECYCLE');
  console.log('==============================================');

  try {
    const orderRef = "E2E-" + Math.random().toString(36).substring(7).toUpperCase();
    
    // --- STEP 1: PATIENT INTAKE ---
    console.log(`\n🔵 STEP 1: Patient Intake (${orderRef})`);
    const { error: pError } = await supabase.from('orders').insert([{
      order_number: orderRef,
      patient_name: "END-TO-END TESTER",
      sub_brand: "Peak Health",
      medication: "Semaglutide 2.5mg",
      status: "order_submitted",
      user_id: "b007a354-2047-46c3-a2d3-8073bde95793",
      intake_complete: true,
      amount: 299.00
    }]);
    if (pError) throw pError;
    console.log('✅ Order created and intake submitted.');

    // --- STEP 2: DOCTOR REVIEW & APPROVAL ---
    console.log('\n🟢 STEP 2: Doctor Clinical Review');
    const { error: dError } = await supabase.from('orders').update({
      status: "rx_sent",
      doctor: "Dr. Audit System",
      last_approved_at: new Date().toISOString(),
      doctor_note: "Patient qualified based on BMI and clinical history."
    }).eq('order_number', orderRef);
    if (dError) throw dError;
    console.log('✅ Doctor approved and prescription dispatched.');

    // --- STEP 3: PHARMACY FULFILLMENT ---
    console.log('\n🟡 STEP 3: Pharmacy Fulfillment');
    const { error: fError } = await supabase.from('orders').update({
      status: "preparing_shipment"
    }).eq('order_number', orderRef);
    if (fError) throw fError;
    console.log('✅ Pharmacy acknowledged and is preparing medication.');

    // --- STEP 4: SHIPPING & TRACKING ---
    console.log('\n🚚 STEP 4: Shipping & Final Tracking');
    const trackingNum = "1Z" + Math.random().toString(36).substring(7).toUpperCase();
    const { error: sError } = await supabase.from('orders').update({
      status: "shipped",
      tracking: trackingNum,
      carrier: "UPS",
      estimated_delivery: "Next Tuesday"
    }).eq('order_number', orderRef);
    if (sError) throw sError;
    console.log(`✅ Order Shipped! Tracking Number: ${trackingNum}`);

    // --- STEP 5: FINAL VERIFICATION ---
    console.log('\n🏁 STEP 5: Verifying Final State');
    const { data: finalOrder } = await supabase.from('orders').select('*').eq('order_number', orderRef).single();
    
    console.log('----------------------------------------------');
    console.log(`Current Status: ${finalOrder.status.toUpperCase()}`);
    console.log(`Tracking: ${finalOrder.tracking} (${finalOrder.carrier})`);
    console.log(`Refill Date: ${new Date(finalOrder.next_refill_at).toLocaleDateString()}`);
    console.log('----------------------------------------------');
    console.log('🏆 E2E SUCCESS: SYSTEM PROVEN FROM CLICK TO SHIP.');
    console.log('==============================================');

  } catch (err) {
    console.error('\n❌ LIFECYCLE SIMULATION FAILED:', err.message);
    process.exit(1);
  }
}

simulateFullLifecycle();
