const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';

async function checkOrders() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Try to insert a dummy order with minimum fields to see if it works
  const { error } = await supabase.from('orders').insert({
    order_number: 'SCHEMA-TEST-' + Date.now(),
    patient_name: 'Test',
    sub_brand: 'Peak Health',
    medication: 'Test',
    status: 'order_submitted'
  });

  if (error) {
    console.log('Insert failed with error:', error.message);
    if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('Hint: Check column names in error message.');
    }
  } else {
    console.log('Insert successful! Table exists and basic fields are correct.');
  }

  // Fetch one row if exists
  const { data } = await supabase.from('orders').select('*').limit(1);
  if (data && data.length > 0) {
      console.log('Existing order columns:', Object.keys(data[0]));
  } else {
      console.log('Table is empty.');
  }
}

checkOrders();
