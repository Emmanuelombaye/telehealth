const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:@Kenya90!132323@db.vzzmdbdvcofajgrjgajq.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');
    
    const sql = fs.readFileSync('./seed.sql', 'utf8');
    await client.query(sql);
    console.log('Seed data applied and RLS disabled successfully.');
  } catch (err) {
    console.error('Error applying seed:', err);
  } finally {
    await client.end();
  }
}

run();
