// Promote brandon@peakbodyco.com to super_admin
// Prefer: npm run auth:promote-super-admin (uses service role from .env.local)
// Legacy: node promote-admin.cjs (anon key only — limited)

const { createClient } = require('@supabase/supabase-js');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
global.WebSocket = require('ws');

function loadEnvLocal() {
  const p = join(__dirname, '.env.local');
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

const env = { ...process.env, ...loadEnvLocal() };
const SUPABASE_URL = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
      'Add them to .env.local or run: npm run auth:promote-super-admin',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EMAIL    = env.SUPERADMIN_EMAIL || 'brandon@peakbodyco.com';
const PASSWORD = env.SUPERADMIN_PASSWORD || '@incorrect!';

async function promote() {
  console.log('\n🔐 Peak Health — Admin Promotion Script');
  console.log('==========================================');
  console.log(`📡 Project: ${SUPABASE_URL}`);
  console.log(`📧 Target: ${EMAIL}`);
  console.log(`🎯 Target Role: super_admin + brand_admin\n`);

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('ℹ️  SUPABASE_SERVICE_ROLE_KEY detected — use npm run auth:promote-super-admin instead.\n');
  }

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
        console.error('   Run: npm run auth:promote-super-admin (with service role in .env.local)');
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
        console.log('   Or run: npm run auth:promote-super-admin');
        return;
      }
    }
    console.error('❌ Sign-in failed:', signInError.message);
    console.error('   If status 500: run scripts/sql/RUN_IN_SUPABASE_SUPERADMIN_AUTH.sql in Supabase SQL Editor');
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
  console.log('\n   Login at: /superadmin/login\n');
}

promote().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
