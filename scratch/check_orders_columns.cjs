global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kvopgyhcjcniaocjozje.supabase.co',
  'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ'
);

async function main() {
  console.log('Fetching orders schema...');
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching order row:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('Available columns in orders table:');
    console.log(Object.keys(data[0]).sort().join('\n'));
  } else {
    console.log('No rows found in orders table to inspect columns. Trying select with specific fields...');
  }
}

main();
