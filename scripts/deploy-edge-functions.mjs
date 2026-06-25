/**
 * ============================================================================
 * PEAK HEALTH — Edge Function Deployer (New Supabase Project)
 * ============================================================================
 * Deploys all 24 edge functions to the new Supabase project:
 *   xtczoyjcgljxmqxmkkdh
 *
 * Usage:
 *   node scripts/deploy-edge-functions.mjs
 *
 * Prerequisites:
 *   - Supabase CLI installed (npx supabase --version)
 *   - SUPABASE_ACCESS_TOKEN set (from dashboard.supabase.com → Account → Access Tokens)
 *     OR: already logged in via `npx supabase login`
 * ============================================================================
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_REF = 'xtczoyjcgljxmqxmkkdh';

// All 24 edge functions in the project
const ALL_FUNCTIONS = [
  'ai-medical-scribe',
  'assign-doctor',
  'calendly-webhook',
  'create-payment-intent',
  'dispatch-prescription',
  'email-trigger',
  'invite-doctor',
  'merge-scheduling-pending',
  'partner-api',
  'pharmacy-webhook',
  'pmci-webhook',
  'process-refund',
  'scheduling-webhook',
  'send-otp',
  'stripe-attach-order',
  'stripe-create-refund',
  'stripe-identity-webhook',
  'stripe-webhook',
  'thrivewell-dispatch',
  'truepill-webhook',
  'verify-identity',
  'verify-otp',
  'zoom-video-token',
];

const functionsDir = path.resolve('supabase/functions');

function deployFunction(fnName) {
  const fnDir = path.join(functionsDir, fnName);
  if (!fs.existsSync(fnDir)) {
    console.log(`  ⚠️  Function directory not found, skipping: ${fnName}`);
    return { name: fnName, status: 'skipped' };
  }

  console.log(`  → Deploying: ${fnName} ...`);
  const result = spawnSync(
    'npx',
    ['supabase', 'functions', 'deploy', fnName, '--project-ref', PROJECT_REF, '--no-verify-jwt'],
    {
      cwd: path.resolve('.'),
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000, // 2 min per function
    }
  );

  if (result.status === 0) {
    console.log(`     ✅ ${fnName} deployed successfully`);
    return { name: fnName, status: 'ok' };
  } else {
    const errMsg = (result.stderr || result.stdout || '').slice(0, 200);
    console.log(`     ❌ ${fnName} FAILED: ${errMsg}`);
    return { name: fnName, status: 'error', error: errMsg };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' PEAK HEALTH — Edge Function Deployment');
  console.log(` Target project: ${PROJECT_REF}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Check supabase CLI
  try {
    const ver = execSync('npx supabase --version', { encoding: 'utf8' }).trim();
    console.log(`Supabase CLI: ${ver}\n`);
  } catch {
    console.error('❌ Supabase CLI not found. Run: npm install -g supabase');
    process.exit(1);
  }

  const results = [];
  for (const fnName of ALL_FUNCTIONS) {
    results.push(deployFunction(fnName));
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' DEPLOYMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  const ok = results.filter(r => r.status === 'ok');
  const failed = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');

  console.log(`  ✅ Deployed:  ${ok.length}`);
  console.log(`  ⚠️  Skipped:   ${skipped.length}`);
  console.log(`  ❌ Failed:    ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n  Failed functions:');
    for (const f of failed) {
      console.log(`    - ${f.name}: ${f.error}`);
    }
  }
  console.log('═══════════════════════════════════════════════════════\n');
}

main();
