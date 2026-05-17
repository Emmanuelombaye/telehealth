const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');

const supabase = createClient(
  'https://kvopgyhcjcniaocjozje.supabase.co',
  'sb_publishable_wr1AUarSttsAd7_m3VAH1A_z0jhs2XZ'
);

const EMAIL    = 'admin2@peakbodyco.com';
const PASSWORD = 'Password123!';

async function createAdmin() {
  console.log('\n🔐 Peak Health — Creating New Superadmin');
  console.log('==========================================');

  // 1. Sign up
  console.log('⏳ Signing up new user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
    options: {
      data: {
        first_name: 'Super',
        last_name: 'Admin',
        full_name: 'Super Admin',
        role: 'super_admin',
      }
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('User already registered')) {
        console.log('User already registered! Signing in instead...');
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: EMAIL,
            password: PASSWORD,
        });
        if (signInError) {
            console.error('❌ Failed to sign in:', signInError.message);
            process.exit(1);
        }
    } else {
        console.error('❌ Failed to create account:', signUpError.message);
        process.exit(1);
    }
  }

  // 2. Ensure role is set
  console.log('⏳ Updating role metadata...');
  await supabase.auth.updateUser({
    data: {
      role: 'super_admin',
    }
  });

  console.log('✅ Done! You can now log in with:');
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Password: ${PASSWORD}`);
}

createAdmin().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
