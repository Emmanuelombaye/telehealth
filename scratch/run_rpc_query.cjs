const https = require('https');

const SUPABASE_URL = 'kvopgyhcjcniaocjozje.supabase.co';
const SERVICE_KEY = 'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ'; // Wait, let's verify if VITE_SUPABASE_ANON_KEY is the service role key or anon key

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Testing SQL query execution via RPC...');
  const sql = `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_state TEXT;`;
  try {
    const res = await runSQL(sql);
    console.log('Response Status:', res.status);
    console.log('Response Body:', res.body);
  } catch (err) {
    console.error('Error executing query:', err.message);
  }
}

main();
