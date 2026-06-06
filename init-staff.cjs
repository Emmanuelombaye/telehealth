// Initialize or Reset Staff Accounts (Doctor & Pharmacy)
const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');

// Using production URL from the env
const SUPABASE_URL = 'https://vzzmdbdvcofajgrjgajq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjIyOTQsImV4cCI6MjA5NjMzODI5NH0.Dz4OAZTGycCgxJhDIRVpo9Fp1yW0PFf1-hrWIoTYAUg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STAFF = [
  {
    email: 'doctor@peakbodyco.com',
    password: 'password123',
    role: 'doctor',
    name: 'Clinical Provider'
  },
  {
    email: 'admin@peakbodyco.com',
    password: 'password123',
    role: 'brand_admin',
    name: 'Brand Administrator'
  },
  {
    email: 'pharmacy@peakbodyco.com',
    password: 'password123',
    role: 'pharmacy',
    name: 'Pharmacy Fulfillment'
  }
];

async function initStaff() {
  console.log('\n🏥 Peak Health — Staff Account Initialization');
  console.log('==============================================');

  for (const account of STAFF) {
    console.log(`\n⏳ Processing: ${account.email}...`);

    // 1. Try to sign in first to see if it exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log(`   ⚠️  Account not found. Creating ${account.role} account...`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            data: {
              role: account.role,
              full_name: account.name,
              first_name: account.name.split(' ')[0],
              last_name: account.name.split(' ')[1] || '',
            }
          }
        });

        if (signUpError) {
          console.error(`   ❌ Failed to create ${account.email}:`, signUpError.message);
          continue;
        }

        if (signUpData.session) {
          console.log(`   ✅ Created and signed in!`);
          await supabase.auth.signOut();
        } else {
          console.log(`   📧 Created! CHECK EMAIL INBOX for ${account.email} to confirm.`);
        }
      } else {
        console.error(`   ❌ Error checking ${account.email}:`, signInError.message);
      }
      continue;
    }

    // 2. If exists, ensure role metadata is correct
    console.log(`   ✅ Signed in. Updating metadata...`);
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        role: account.role,
        full_name: account.name,
      }
    });

    if (updateError) {
      console.error(`   ❌ Update failed:`, updateError.message);
    } else {
      console.log(`   ✅ ${account.role.toUpperCase()} role synced.`);
    }

    // 3. Sync to public.profiles
    const userId = signInData.user?.id;
    if (userId) {
       const { error: profileError } = await supabase.from('profiles').upsert({
         id: userId,
         email: account.email,
         role: account.role,
         full_name: account.name,
         updated_at: new Date().toISOString()
       });
       if (profileError) console.warn('   ⚠️  Profile sync skipped:', profileError.message);
    }

    await supabase.auth.signOut();
  }

  console.log('\n==============================================');
  console.log('🎉 Initialization Complete!');
  console.log('If you created new accounts, check the emails to confirm.');
  console.log('==============================================\n');
}

initStaff().catch(console.error);
