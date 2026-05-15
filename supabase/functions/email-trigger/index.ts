import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * Resend + optional Twilio SMS
 * Triggered by Supabase Database Webhooks on `orders` INSERT + UPDATE (configure both in Dashboard).
 */

async function sendResend(apiKey: string, to: string, subject: string, html: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Peak Health <hello@peakhealth.com>",
      to: [to],
      subject,
      html,
    }),
  });
}

async function sendTwilioSms(to: string, body: string): Promise<void> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER") || Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
  if (!sid || !token || !from) return;

  const form = new URLSearchParams();
  form.set("To", to);
  if (from.startsWith("MG")) {
    form.set("MessagingServiceSid", from);
  } else {
    form.set("From", from);
  }
  form.set("Body", body.slice(0, 1400));

  const auth = btoa(`${sid}:${token}`);
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
}

function patientPhone(record: Record<string, unknown>): string | null {
  const v = record.patient_vitals;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const p = (v as Record<string, unknown>).phone;
    if (typeof p === "string" && p.replace(/\D/g, "").length >= 10) {
      const d = p.replace(/\D/g, "");
      return p.startsWith("+") ? p : `+1${d.slice(-10)}`;
    }
  }
  return null;
}

async function resolveBookingLink(
  supabase: ReturnType<typeof createClient>,
  record: Record<string, unknown>
): Promise<string> {
  const fallback = "https://peakhealth.com/patient/appointments";
  const doctorId = record.doctor_id as string | undefined;
  if (doctorId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("calendly_url, full_name")
      .eq("id", doctorId)
      .maybeSingle();
    const cal = profile?.calendly_url;
    if (typeof cal === "string" && /^https?:\/\//i.test(cal.trim())) return cal.trim();
  }
  const saved = record.scheduling_booking_url;
  if (typeof saved === "string" && /^https?:\/\//i.test(saved.trim())) return saved.trim();
  return fallback;
}

async function sendVideoBookingRequested(
  supabase: ReturnType<typeof createClient>,
  resendApiKey: string,
  record: Record<string, unknown>,
  opts: { isInsert: boolean }
): Promise<void> {
  const patientEmail =
    (typeof record.patient_email === "string" && record.patient_email.includes("@"))
      ? (record.patient_email as string)
      : "patient@example.com";

  const bookingLink = await resolveBookingLink(supabase, record);
  const doctorName = (record.doctor as string) || "your care team";

  const intro = opts.isInsert
    ? `<p>Your program requires a brief <strong>video visit</strong> with a licensed clinician before we finalize care.</p>
       <p>Use the link below to pick a time. Your meeting link (Zoom or Google Meet) is created by the scheduler when you book.</p>`
    : `<p><strong>${doctorName}</strong> requests a brief video visit before finalizing your treatment.</p>`;

  const subject = opts.isInsert
    ? `Book your video visit — ${doctorName}`
    : `Action required: video consultation — ${doctorName}`;

  const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0;">
          <h2 style="color: #064e3b;">Hi ${record.patient_name || "Patient"},</h2>
          ${intro}
          <div style="margin: 24px 0; text-align: center;">
            <a href="${bookingLink}" style="background-color: #22c55e; color: #0f172a; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Book a time</a>
          </div>
          <p style="color: #475569; font-size: 14px;"><strong>Message:</strong></p>
          <blockquote style="border-left: 4px solid #22c55e; padding-left: 12px; color: #334155;">
            ${String(record.zoom_doctor_message || "Please schedule a short video consultation.")}
          </blockquote>
        </div>`;
  await sendResend(resendApiKey, patientEmail, subject, html);
  const phone = patientPhone(record);
  if (phone) {
    await sendTwilioSms(
      phone,
      `Peak Health: book your video visit with ${doctorName}. ${bookingLink}`.slice(0, 300)
    );
  }
}

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record as Record<string, unknown>;
    const oldRecord = (payload.old_record || {}) as Record<string, unknown>;
    const pType = payload.type as string;

    if (pType !== "INSERT" && pType !== "UPDATE") {
      return new Response("Ignored - not INSERT/UPDATE", { status: 200 });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is missing in environment variables");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const patientEmail =
      (typeof record.patient_email === "string" && record.patient_email.includes("@"))
        ? record.patient_email
        : "patient@example.com";

    // ── INSERT: new enrollment / order that required sync video (see Shop.tsx zoom_status) ──
    if (pType === "INSERT" && record.zoom_status === "requested") {
      await sendVideoBookingRequested(supabase, resendApiKey, record, { isInsert: true });
      return new Response(JSON.stringify({ success: true, event: "video_booking_insert" }), { status: 200 });
    }

    // ── UPDATE: video requested transition (e.g. doctor queue) ───────────────
    if (pType === "UPDATE" && record.zoom_status === "requested" && oldRecord.zoom_status !== "requested") {
      await sendVideoBookingRequested(supabase, resendApiKey, record, { isInsert: false });
      return new Response(JSON.stringify({ success: true, event: "video_booking_update" }), { status: 200 });
    }

    // ── Video confirmed with join link ──
    if (pType === "UPDATE") {
      const joinUrl = record.zoom_join_url as string | undefined;
      if (
        record.zoom_status === "confirmed" &&
        joinUrl &&
        joinUrl.startsWith("http") &&
        oldRecord.zoom_join_url !== joinUrl
      ) {
        const subject = `Your video visit is confirmed — join link inside`;
        const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2>Hi ${record.patient_name || "Patient"},</h2>
          <p>Your video consultation is confirmed.</p>
          <p><a href="${joinUrl}" style="color:#059669;font-weight:bold;">Join your visit</a></p>
        </div>`;
        await sendResend(resendApiKey, patientEmail, subject, html);
        const phone = patientPhone(record);
        if (phone) {
          await sendTwilioSms(phone, `Peak Health: Join your visit ${joinUrl}`.slice(0, 300));
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      if (record.status === "rx_sent" && oldRecord.status !== "rx_sent") {
        const subject = `Your prescription has been sent`;
        const html = `
         <h2>Hi ${record.patient_name || "Patient"},</h2>
         <p>Your doctor approved your consultation and sent the prescription to the pharmacy.</p>
         <p>We will notify you when it ships.</p>
       `;
        await sendResend(resendApiKey, patientEmail, subject, html);

        const pharmacyEmail = (record.pharmacy_email as string) || "dispatch@vialsrx.com";
        const rxSubject = `PRESCRIPTION DIRECTIVE: ${record.patient_name} - ${record.medication}`;
        const rxHtml = `
        <div style="font-family: sans-serif; border: 2px solid #064e3b; padding: 30px; border-radius: 12px;">
          <h1 style="color: #064e3b; margin-top: 0;">Prescription Order</h1>
          <p><strong>Patient:</strong> ${record.patient_name}</p>
          <p><strong>MRN:</strong> ${record.mrn || "N/A"}</p>
          <p><strong>Medication:</strong> ${record.medication}</p>
          <p><strong>Sig:</strong> ${record.dosage_instructions || "As directed"}</p>
          <p><strong>Prescriber:</strong> ${record.doctor || "Attending Physician"}</p>
        </div>
      `;
        await sendResend(resendApiKey, pharmacyEmail, rxSubject, rxHtml);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      if (record.status === "cancelled" && oldRecord.status !== "cancelled") {
        const subject = `Update regarding your consultation`;
        const html = `
         <h2>Hi ${record.patient_name || "Patient"},</h2>
         <p>Your recent consultation could not be approved at this time. A refund has been initiated where applicable.</p>
         <p>Message from your doctor: <i>${record.doctor_note || "Patient did not qualify based on medical history."}</i></p>
       `;
        await sendResend(resendApiKey, patientEmail, subject, html);
        const phone = patientPhone(record);
        if (phone) {
          await sendTwilioSms(
            phone,
            `Peak Health: Your consultation was not approved. Check email for details.`
          );
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
    }

    return new Response("Ignored - No relevant status change", { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Email Webhook Error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
