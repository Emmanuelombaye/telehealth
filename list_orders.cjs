const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://kvopgyhcjcniaocjozje.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';

async function listOrders() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await supabase.auth.signInWithPassword({
    email: 'admin@peakbodyco.com',
    password: 'password123'
  });

  const { data } = await supabase.from('orders').select('order_number, status').limit(5);
  console.log('Orders found:', data);
}

listOrders();
