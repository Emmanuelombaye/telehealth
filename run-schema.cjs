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
    
    const sql = fs.readFileSync('./supabase_doctor_clinical_policies.sql', 'utf8');
    await client.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await client.end();
  }
}

run();
