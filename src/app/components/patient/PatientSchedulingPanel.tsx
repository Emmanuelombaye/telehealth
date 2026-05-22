import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Loader2, Video } from "lucide-react";
import { Badge, Card, CardContent, cn } from "../ui/shared.tsx";
import {
  detectSchedulingProvider,
  toSchedulingOpenTabUrl,
  type SchedulingProvider,
} from "../../../lib/calendlyEmbed";

const CALENDLY_MESSAGE_ORIGINS = new Set(["https://calendly.com", "https://www.calendly.com"]);

function providerBadgeLabel(p: SchedulingProvider): string {
  if (p === "calendly") return "Calendly";
  if (p === "calcom") return "Cal.com";
  return "Scheduler";
}

export type PatientSchedulingPanelProps = {
  /** Full iframe `src` (already normalized for Calendly / Cal.com). */
  embedSrc: string;
  /** Raw booking base URL (doctor or product link) for provider detection. */
  rawBookingUrl: string;
  /** Optional: assigned clinician display name. */
  doctorName?: string | null;
  /** e.g. "Licensed in your state" or product-specific line. */
  doctorHint?: string | null;
  /** True while loading clinician list (embed may already show product / default URL). */
  doctorMatchPending?: boolean;
  /** Shown in UI for support correlation (webhooks / utm_content). */
  schedulingRefTail?: string | null;
  /** Calendly iframe fires `calendly.event_scheduled` — auto-acknowledge booking. */
  onCalendlyBookingConfirmed?: () => void;
  className?: string;
};

/**
 * Embedded Calendly / Cal.com (or generic https) booking — aligned with in-flow video visit enrollment.
 */
export function PatientSchedulingPanel({
  embedSrc,
  rawBookingUrl,
  doctorName,
  doctorHint,
  doctorMatchPending,
  schedulingRefTail,
  onCalendlyBookingConfirmed,
  className,
}: PatientSchedulingPanelProps) {
  const provider = detectSchedulingProvider(rawBookingUrl);
  const openTabUrl = toSchedulingOpenTabUrl(embedSrc) || toSchedulingOpenTabUrl(rawBookingUrl) || embedSrc;
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
  }, [embedSrc]);

  useEffect(() => {
    if (!onCalendlyBookingConfirmed || provider !== "calendly") return;
    const onMessage = (e: MessageEvent) => {
      if (!CALENDLY_MESSAGE_ORIGINS.has(e.origin)) return;
      const ev = e.data;
      if (ev && typeof ev === "object" && "event" in ev && (ev as { event?: string }).event === "calendly.event_scheduled") {
        onCalendlyBookingConfirmed();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onCalendlyBookingConfirmed, provider]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step 8 of 9 · Intake</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold tracking-tight">Schedule your video visit</h2>
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wide">
              {providerBadgeLabel(provider)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">
            Your program requires a live video consultation. Pick a time below —{" "}
            <strong className="text-foreground font-medium">Zoom or Google Meet</strong> is created automatically by
            your scheduler when you confirm the appointment.
          </p>
        </div>
        <a
          href={openTabUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-transparent px-4 text-[10px] font-black uppercase tracking-widest text-[#0A0D14] transition-colors hover:bg-[#F8FAFC]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in browser
        </a>
      </div>

      <ol className="grid gap-2 md:grid-cols-3 text-xs text-slate-600">
        <li className="flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
            1
          </span>
          <span>
            <span className="font-semibold text-slate-900">Choose a time</span> in the calendar — your name and email
            may be prefilled from enrollment.
          </span>
        </li>
        <li className="flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
            2
          </span>
          <span>
            <span className="font-semibold text-slate-900">Confirm</span> — the scheduler emails or texts your unique
            meeting link.
          </span>
        </li>
        <li className="flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
            3
          </span>
          <span>
            <span className="font-semibold text-slate-900">Check the box</span> below to confirm you booked before
            submitting enrollment.
          </span>
        </li>
      </ol>

      {doctorMatchPending && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>
            <span className="font-semibold">Matching your clinician…</span>{" "}
            <span className="text-blue-800/90">
              You can start booking; the calendar may refresh if we assign a provider-specific link.
            </span>
          </span>
        </div>
      )}

      {(doctorName || doctorHint || schedulingRefTail) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
          <Video className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
          <span className="text-emerald-950">
            {doctorName ? (
              <>
                <span className="font-semibold">{doctorName}</span>
                {doctorHint ? <span className="text-emerald-800/90"> — {doctorHint}</span> : null}
              </>
            ) : (
              <span className="font-medium">Clinical team calendar</span>
            )}
            {schedulingRefTail ? (
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">· ref …{schedulingRefTail}</span>
            ) : null}
          </span>
        </div>
      )}

      <Card className="border-slate-200 overflow-hidden shadow-md shadow-slate-200/60 bg-white">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
            <Calendar className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            <span className="font-semibold text-slate-900">Book with our clinical team</span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="text-slate-600">
              Calendar opens in-page; meeting links are sent by your scheduler (Calendly, Cal.com, etc.).
            </span>
          </div>
          <div className="relative w-full bg-white min-h-[min(72vh,720px)] sm:min-h-[640px]">
            {!iframeLoaded && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-[2px]"
                aria-busy="true"
                aria-label="Loading scheduler"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Loading calendar…</p>
                <p className="text-xs text-muted-foreground max-w-xs text-center px-4">
                  If this takes too long, use &quot;Open in browser&quot; above.
                </p>
              </div>
            )}
            <iframe
              key={embedSrc}
              title="Schedule your video visit"
              src={embedSrc}
              onLoad={() => setIframeLoaded(true)}
              className="w-full min-h-[min(72vh,720px)] sm:min-h-[640px] border-0"
              allow="fullscreen; clipboard-read; clipboard-write"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
