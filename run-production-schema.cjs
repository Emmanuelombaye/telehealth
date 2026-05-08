const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:@Kenya90!132323@db.kvopgyhcjcniaocjozje.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');
    
    const sql = fs.readFileSync('./supabase_production_schema.sql', 'utf8');
    await client.query(sql);
    console.log('Production Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await client.end();
  }
}

run();
