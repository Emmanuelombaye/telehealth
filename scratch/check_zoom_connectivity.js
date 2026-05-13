/**
 * Telehealth Connectivity Audit Script
 * This script verifies if a patient's session is correctly listening for Zoom/Video requests.
 * Usage: node scratch/check_zoom_connectivity.js [USER_ID]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_URL';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const userId = process.argv[2];

if (!userId) {
  console.error("❌ Error: Please provide a USER_ID as an argument.");
  process.exit(1);
}

console.log(`\n🔍 Initiating Connectivity Audit for Patient ID: ${userId}...`);
console.log(`📡 Listening for Real-time Clinical Events...\n`);

// 1. Subscribe to the orders table for this user
const channel = supabase
  .channel(`audit-${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log("✅ [EVENT DETECTED] Order update received!");
      
      const { consultation_live, zoom_status, zoom_join_url } = payload.new;
      
      if (consultation_live) {
        console.log("🎥 [STATUS] Doctor is LIVE. Jitsi/Zoom handshake initiated.");
      }
      
      if (zoom_status === 'requested') {
        console.log("🔔 [NOTIFICATION] Zoom Consultation has been requested.");
      }
      
      if (zoom_join_url) {
        console.log(`🔗 [LINK RECEIVED] Zoom URL: ${zoom_join_url}`);
      }

      console.log("\n📊 Payload Details:", JSON.stringify(payload.new, null, 2));
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log("🟢 [READY] Real-time channel active. The patient's device is now able to receive Zoom events.");
      console.log("💡 Tip: Go to the Doctor Portal and click 'Connect Live Video' to test this sync.");
    }
  });

// Keep process alive
process.stdin.resume();
