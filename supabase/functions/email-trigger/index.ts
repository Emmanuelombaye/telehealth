import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Resend Email Webhook
 * 
 * Triggered by Supabase Database Webhooks when significant events happen 
 * (e.g. video call requested, order shipped, or account created).
 */

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    
    // We only want to trigger emails on certain status changes
    if (payload.type !== "UPDATE") {
      return new Response("Ignored - Not an UPDATE", { status: 200 });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is missing in environment variables");
    }

    let subject = "";
    let htmlContent = "";
    
    // Example logic based on the updated record
    if (record.zoom_status === 'requested' && payload.old_record.zoom_status !== 'requested') {
      subject = `Your Doctor Requested a Video Consultation`;
      htmlContent = `
        <h2>Hi ${record.patient_name || 'Patient'},</h2>
        <p>After reviewing your medical intake form, your doctor has requested a brief video consultation to discuss your case before finalizing the prescription.</p>
        <p><strong><a href="https://calendly.com/your-doctor-calendar">Click here to book a time on the doctor's calendar</a></strong></p>
        <p>Message from your doctor: <i>${record.zoom_doctor_message || 'I need to speak with you regarding your intake form.'}</i></p>
      `;
    } else if (record.status === 'rx_sent' && payload.old_record.status !== 'rx_sent') {
       subject = `Your Prescription has been Sent!`;
       htmlContent = `
         <h2>Hi ${record.patient_name || 'Patient'},</h2>
         <p>Your doctor has approved your consultation and sent the prescription to the pharmacy.</p>
         <p>We will notify you again once it has shipped!</p>
       `;
    } else if (record.status === 'cancelled' && payload.old_record.status !== 'cancelled') {
       subject = `Update regarding your Consultation`;
       htmlContent = `
         <h2>Hi ${record.patient_name || 'Patient'},</h2>
         <p>Your recent consultation could not be approved at this time. A refund has been initiated.</p>
         <p>Message from your doctor: <i>${record.doctor_note || 'Patient did not qualify based on medical history.'}</i></p>
       `;
    } else {
       return new Response("Ignored - No relevant status change", { status: 200 });
    }

    // Call Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: "Telehealth Team <hello@yourtelehealthbrand.com>",
        to: [record.patient_email || "patient@example.com"], // Assume patient_email exists, or query auth.users
        subject: subject,
        html: htmlContent
      })
    });

    if (!res.ok) {
      throw new Error(`Resend API Error: ${await res.text()}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Email Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
