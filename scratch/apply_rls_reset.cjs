
const { Client } = require('pg');
const fs = require('fs');

async function resetRLS() {
  const connectionString = `postgresql://postgres.kvopgyhcjcniaocjozje:@Kenya90!132323@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database.');
    const sql = fs.readFileSync('f:/telehealth/supabase_mvp_rls_reset.sql', 'utf8');
    await client.query(sql);
    console.log('RLS policies reset to public for testing.');
    await client.end();
  } catch (err) {
    console.error('Failed to reset RLS:', err.message);
    process.exit(1);
  }
}

resetRLS();
