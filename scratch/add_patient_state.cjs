const { Client } = require('pg');

async function run() {
  const connectionString = `postgresql://postgres.kvopgyhcjcniaocjozje:@Kenya90!132323@db.kvopgyhcjcniaocjozje.supabase.co:5432/postgres`;
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database successfully as Postgres via direct host.');

    const queries = [
      `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_state TEXT;`,
      `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state TEXT;`,
      `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT;`,
      `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;`,
      `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_zip TEXT;`
    ];

    for (const q of queries) {
      console.log(`Executing: ${q}`);
      await client.query(q);
    }

    console.log('🎉 Database migration completed successfully.');
    await client.end();
  } catch (err) {
    console.error('Failed to run migration:', err.message);
    process.exit(1);
  }
}

run();
