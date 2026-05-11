// simulate_webhook.cjs
// Use this to simulate a pharmacy dispatching an order (Step 11 in Backend Flow)
// Usage: node simulate_webhook.cjs <ORDER_NUMBER>

const { createClient } = require('@supabase/supabase-client');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function simulateDispatch(orderNumber) {
  console.log(`🚀 Simulating Pharmacy Dispatch for Order: ${orderNumber}...`);

  const trackingNum = `1Z${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  const trackingUrl = `https://www.ups.com/track?tracknum=${trackingNum}`;

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'shipped',
      tracking_number: trackingNum,
      tracking_url: trackingUrl,
      carrier: 'UPS Express',
      estimated_delivery: 'In 2-3 Business Days',
      pharmacy_note: 'Package has been picked up by the carrier and is in transit.'
    })
    .eq('order_number', orderNumber)
    .select();

  if (error) {
    console.error('❌ Error simulating dispatch:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`✅ Success! Order ${orderNumber} is now SHIPPED.`);
    console.log(`📦 Tracking Number: ${trackingNum}`);
  } else {
    console.log(`⚠️ Order ${orderNumber} not found.`);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node simulate_webhook.cjs <ORDER_NUMBER>');
} else {
  simulateDispatch(args[0]);
}
