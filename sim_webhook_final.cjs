const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';

async function simulateWebhook() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('--- 1. Signing in as Admin ---');
  await supabase.auth.signInWithPassword({
    email: 'admin@peakbodyco.com',
    password: 'password123'
  });

  const orderNumber = 'RX-DOYNG5';
  console.log(`\n--- 2. Simulating Webhook for ${orderNumber} ---`);
  
  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      status: 'shipped',
      tracking_number: '9400111899223821623119',
      carrier: 'USPS',
      tracking_url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223821623119',
      estimated_delivery: '2024-12-15'
    })
    .eq('order_number', orderNumber)
    .select()
    .single();

  if (error) {
    console.error('Update failed:', error.message);
  } else {
    console.log('✅ Simulation Successful!');
    console.log('Order Number:', updated.order_number);
    console.log('New Status:', updated.status);
    console.log('Tracking Number:', updated.tracking_number);
  }
}

simulateWebhook();
