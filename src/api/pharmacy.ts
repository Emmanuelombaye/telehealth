import { supabase } from '../lib/supabaseClient';

/**
 * Pharmacy API Simulation Service
 * 
 * In a true production environment, the Supabase database would fire a webhook to an 
 * Edge Function, which would call Truepill/Curexa. 
 * 
 * For this UI demonstration, we simulate the webhook response by waiting 5 seconds
 * after the Doctor approves the Rx, and then automatically injecting a tracking number
 * into the database.
 */
export const PharmacyService = {
  /**
   * Simulates the outbound call to the Pharmacy and the async webhook response.
   */
  async simulateFulfillment(orderId: string, medication: string) {
    console.log(`[Pharmacy API] Received Rx for order ${orderId}: ${medication}`);
    console.log(`[Pharmacy API] Processing order...`);

    // Simulate the time it takes for a pharmacy to process and pack the order (5 seconds for demo)
    setTimeout(async () => {
      // Generate a realistic-looking USPS tracking number
      const mockTrackingNumber = `94001112020${Math.floor(Math.random() * 1000000000)}`;
      const carrier = "USPS";
      const trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${mockTrackingNumber}`;
      
      // Calculate estimated delivery (3 days from now)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      const estDelivery = deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      console.log(`[Pharmacy API] Order ${orderId} packed! Tracking: ${mockTrackingNumber}`);

      // Update the database to 'shipped' bypassing the Admin entirely!
      try {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'shipped',
            tracking: mockTrackingNumber,
            carrier: carrier,
            tracking_url: trackingUrl,
            estimated_delivery: estDelivery
          })
          .eq('order_number', orderId);

        if (error) throw error;
        
        console.log(`[Pharmacy Webhook] Successfully updated database for ${orderId}`);
      } catch (err) {
        console.error(`[Pharmacy Webhook] Failed to update order:`, err);
      }

    }, 5000); // 5 second delay to visually show the transition
  }
};
