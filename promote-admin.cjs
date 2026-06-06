// Promote brandon@peakbodyco.com to super_admin
// This signs in as the user and updates their own metadata via Auth API
// No service role key or database access needed.

const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');
const supabase = createClient(
  'https://vzzmdbdvcofajgrjgajq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6em1kYmR2Y29mYWpncmpnYWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjIyOTQsImV4cCI6MjA5NjMzODI5NH0.Dz4OAZTGycCgxJhDIRVpo9Fp1yW0PFf1-hrWIoTYAUg'
);

const EMAIL    = 'brandon@peakbodyco.com';
const PASSWORD = '@incorrect!';

async function promote() {
  console.log('\n🔐 Peak Health — Admin Promotion Script');
  console.log('==========================================');
  console.log(`📧 Target: ${EMAIL}`);
  console.log(`🎯 Target Role: super_admin + brand_admin\n`);

  // Step 1: Sign in
  console.log('⏳ Step 1/3 — Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (signInError) {
    // User may not exist — create them first
    if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('invalid')) {
      console.log('⚠️  Account not found. Creating new account...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: EMAIL,
        password: PASSWORD,
        options: {
          data: {
            first_name: 'Brandon',
            last_name: 'Admin',
            full_name: 'Brandon Admin',
            role: 'super_admin',
            brand_id: 'peak',
          }
        }
      });

      if (signUpError) {
        console.error('❌ Failed to create account:', signUpError.message);
        process.exit(1);
      }

      if (signUpData.session) {
        console.log('✅ Account created with super_admin role!');
        console.log('\n🎉 Brandon is now SUPER ADMIN');
        console.log(`   Email: ${EMAIL}`);
        console.log(`   Password: ${PASSWORD}`);
        console.log(`   Role: super_admin`);
        await supabase.auth.signOut();
        return;
      } else {
        console.log('📧 Account created! Email confirmation may be required.');
        console.log('   Check brandon@peakbodyco.com inbox and confirm the email.');
        console.log('   Then run this script again to promote the role.');
        return;
      }
    }
    console.error('❌ Sign-in failed:', signInError.message);
    process.exit(1);
  }

  console.log(`✅ Signed in as ${signInData.user?.email}`);
  console.log(`   Current role: ${signInData.user?.user_metadata?.role || 'not set'}`);

  // Step 2: Update role metadata
  console.log('\n⏳ Step 2/3 — Updating role to super_admin...');
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    data: {
      role: 'super_admin',
      brand_id: 'peak',
      first_name: signInData.user?.user_metadata?.first_name || 'Brandon',
      last_name: signInData.user?.user_metadata?.last_name || 'Admin',
      full_name: signInData.user?.user_metadata?.full_name || 'Brandon Admin',
    }
  });

  if (updateError) {
    console.error('❌ Role update failed:', updateError.message);
    await supabase.auth.signOut();
    process.exit(1);
  }

  console.log('✅ Role updated successfully!');
  console.log(`   New role: ${updateData.user?.user_metadata?.role}`);

  // Step 3: Verify + update profiles table (best effort)
  console.log('\n⏳ Step 3/3 — Syncing profiles table...');
  const userId = updateData.user?.id;
  if (userId) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: EMAIL,
      full_name: 'Brandon Admin',
      role: 'super_admin',
      brand_id: 'peak',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (profileError) {
      console.warn('⚠️  Profiles table sync skipped (non-fatal):', profileError.message);
    } else {
      console.log('✅ Profile row synced.');
    }
  }

  // Sign out
  await supabase.auth.signOut();

  console.log('\n==========================================');
  console.log('🎉 SUCCESS! Brandon is now SUPER ADMIN');
  console.log('==========================================');
  console.log(`   📧 Email:    ${EMAIL}`);
  console.log(`   🔑 Password: ${PASSWORD}`);
  console.log(`   👑 Role:     super_admin`);
  console.log('\n   Login at: http://localhost:5173/admin/login');
  console.log('   (Also works at /doctor and /patient portals)\n');
}

promote().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
