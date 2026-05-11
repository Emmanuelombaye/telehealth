const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://kvopgyhcjcniaocjozje.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ';

async function checkSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'orders' });
  
  if (error) {
    // If RPC doesn't exist, try a simple select with limit 0
    const { data: cols, error: colErr } = await supabase.from('orders').select('*').limit(1);
    if (colErr) {
      console.error('Error fetching columns:', colErr.message);
      return;
    }
    console.log('Columns in "orders" table:', Object.keys(cols[0] || {}));
  } else {
    console.log('Columns:', data);
  }
}

checkSchema();
