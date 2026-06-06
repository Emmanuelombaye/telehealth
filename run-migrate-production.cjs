const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDc2MjI5NCwiZXhwIjoyMDk2MzM4Mjk0fQ.UTaWWdHsCSBRG1ZP4Rsp1ixnhUeMIJurUvxpowBAhCM';

// Each SQL statement to run via Supabase RPC
const migrations = [
  // Doctor Schedules
  `CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    doctor_id UUID PRIMARY KEY,
    schedule JSONB NOT NULL DEFAULT '{}',
    timezone TEXT DEFAULT 'America/New_York',
    buffer_mins INTEGER DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='doctor_schedules' AND policyname='Doctors manage own schedule') THEN
      CREATE POLICY "Doctors manage own schedule" ON public.doctor_schedules USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);
    END IF;
  END $$`,

  // Lab Orders
  `CREATE TABLE IF NOT EXISTS public.lab_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID,
    patient_id UUID,
    patient_name TEXT,
    tests TEXT[],
    priority TEXT DEFAULT 'routine',
    notes TEXT,
    status TEXT DEFAULT 'pending',
    ordered_by TEXT,
    ordered_date TEXT,
    report_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lab_orders' AND policyname='Authenticated users access lab orders') THEN
      CREATE POLICY "Authenticated users access lab orders" ON public.lab_orders FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    END IF;
  END $$`,

  // Lab Results
  `CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    lab_order_id UUID,
    panel_name TEXT NOT NULL,
    ordered_by TEXT,
    status TEXT DEFAULT 'new',
    tests JSONB DEFAULT '[]'::jsonb,
    report_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lab_results' AND policyname='Authenticated access lab results') THEN
      CREATE POLICY "Authenticated access lab results" ON public.lab_results FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    END IF;
  END $$`,

  // Messages
  `CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID,
    receiver_id UUID,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='messages' AND policyname='Users access their own messages') THEN
      CREATE POLICY "Users access their own messages" ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id) WITH CHECK (auth.uid() = sender_id);
    END IF;
  END $$`,

  // Patient Documents
  `CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Other',
    size TEXT,
    url TEXT,
    storage_path TEXT,
    new BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='patient_documents' AND policyname='Authenticated access patient documents') THEN
      CREATE POLICY "Authenticated access patient documents" ON public.patient_documents FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    END IF;
  END $$`,

  // Appointments
  `CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    doctor_id UUID,
    scheduled_time TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled',
    consultation_type TEXT DEFAULT 'video',
    video_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='appointments' AND policyname='Authenticated users access appointments') THEN
      CREATE POLICY "Authenticated users access appointments" ON public.appointments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    END IF;
  END $$`,

  // Add missing columns to profiles
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English'`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_type TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT`,
  `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`,

  // Enable Realtime
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_orders`,
  `ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments`,
];

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'vzzmdbdvcofajgrjgajq.supabase.co',
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

// Use Supabase Management API via pg directly
// Since RPC won't work without a custom function, write to a file for manual paste
async function main() {
  console.log('📋 Generating migration for Supabase SQL Editor...\n');
  
  const allSQL = migrations.join(';\n\n') + ';';
  fs.writeFileSync('./supabase_paste_in_editor.sql', allSQL);
  
  console.log('✅ File created: supabase_paste_in_editor.sql');
  console.log('\n📌 INSTRUCTIONS:');
  console.log('   1. Go to https://supabase.com/dashboard/project/vzzmdbdvcofajgrjgajq/sql/new');
  console.log('   2. Open supabase_paste_in_editor.sql');
  console.log('   3. Copy the contents and paste into the Supabase SQL Editor');
  console.log('   4. Click "Run" (▶ button)');
  console.log('\n   That\'s it! All tables will be created instantly.\n');
  
  console.log('📂 File location: ' + require('path').resolve('./supabase_paste_in_editor.sql'));
}

main();
