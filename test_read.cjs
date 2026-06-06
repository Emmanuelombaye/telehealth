const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';

async function testRead() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('--- 1. Signing in as Admin ---');
  await supabase.auth.signInWithPassword({
    email: 'admin@peakbodyco.com',
    password: 'password123'
  });

  console.log('\n--- 2. Fetching Orders ---');
  const { data, error } = await supabase.from('orders').select('*').limit(5);
  
  if (error) {
    console.error('Fetch failed:', error.message);
  } else {
    console.log('Successfully fetched', data.length, 'orders.');
    if (data.length > 0) {
        console.log('First order status:', data[0].status);
        console.log('Columns:', Object.keys(data[0]));
    }
  }
}

testRead();
