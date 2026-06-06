const { Client } = require('pg');
const fs = require('fs');

async function testConnection(host) {
  const connectionString = `postgresql://postgres.vzzmdbdvcofajgrjgajq:@Kenya90!132323@${host}:6543/postgres`;
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`Connected successfully to ${host}`);
    const sql = fs.readFileSync('./supabase_brands_schema.sql', 'utf8');
    await client.query(sql);
    console.log('Brands schema applied successfully.');
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed on ${host}: ${err.message}`);
    return false;
  }
}

async function run() {
  const hosts = [
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com'
  ];
  
  for (const host of hosts) {
    if (await testConnection(host)) {
      break;
    }
  }
}
run();
