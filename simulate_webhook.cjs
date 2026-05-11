const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kvopgyhcjcniaocjozje.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';

async function testWebhookSim() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('--- 1. Signing in as Admin ---');
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@peakbodyco.com',
    password: 'password123'
  });

  if (authErr) {
    console.error('Login failed:', authErr.message);
    return;
  }
  console.log('Logged in as Admin');

  console.log('\n--- 2. Creating Test Order ---');
  const orderNum = 'PEAK-TEST-' + Math.floor(Math.random() * 1000);
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert([{
      order_number: orderNum,
      patient_name: 'Webhook Test User',
      medication: 'Semaglutide 0.5mg',
      status: 'rx_sent',
      sub_brand: 'Peak Health',
      amount: '199',
      ordered_date: new Date().toISOString(),
      patient_id: (await supabase.auth.getUser()).data.user.id
    }])
    .select()
    .single();

  if (orderErr) {
    console.error('Error creating order:', orderErr.message);
    return;
  }
  console.log('Created order:', order.order_number, 'ID:', order.id);

  console.log('\n--- 3. Simulating Pharmacy Webhook Update ---');
  const { data: updated, error: updateErr } = await supabase
    .from('orders')
    .update({
      status: 'shipped',
      tracking_number: '9400111899223821623119',
      carrier: 'USPS',
      tracking_url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223821623119',
      estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pharmacy_name: 'Truepill',
      pharmacy_event: 'shipped',
      updated_at: new Date().toISOString()
    })
    .eq('order_number', orderNum)
    .select()
    .single();

  if (updateErr) {
    console.error('Error updating order:', updateErr.message);
    return;
  }
  console.log('✅ Webhook Simulation Success!');
  console.log('New Status:', updated.status);
  console.log('Tracking:', updated.tracking_number);
}

testWebhookSim();
