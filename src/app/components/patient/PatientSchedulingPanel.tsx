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

      <ol className="grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground">
        <li className="flex gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            1
          </span>
          <span>
            <span className="font-semibold text-foreground">Choose a time</span> in the calendar — your name and email
            may be prefilled from enrollment.
          </span>
        </li>
        <li className="flex gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            2
          </span>
          <span>
            <span className="font-semibold text-foreground">Confirm</span> — the scheduler emails or texts your unique
            meeting link.
          </span>
        </li>
        <li className="flex gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
            3
          </span>
          <span>
            <span className="font-semibold text-foreground">Check the box</span> below to confirm you booked before
            submitting enrollment.
          </span>
        </li>
      </ol>

      {doctorMatchPending && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-2 text-xs text-blue-950 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-blue-100">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>
            <span className="font-semibold">Matching your clinician…</span>{" "}
            <span className="text-blue-900/85 dark:text-blue-200/90">
              You can start booking; the calendar may refresh if we assign a provider-specific link.
            </span>
          </span>
        </div>
      )}

      {(doctorName || doctorHint || schedulingRefTail) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-3 py-2 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/25">
          <Video className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span className="text-emerald-950 dark:text-emerald-100">
            {doctorName ? (
              <>
                <span className="font-semibold">{doctorName}</span>
                {doctorHint ? <span className="text-emerald-800/90 dark:text-emerald-200/90"> — {doctorHint}</span> : null}
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

      <Card className="border-primary/25 overflow-hidden shadow-md shadow-primary/5">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border text-xs">
            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold text-foreground">Book with our clinical team</span>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Calendar opens in-page; meeting links are sent by your scheduler (Calendly, Cal.com, etc.).
            </span>
          </div>
          <div className="relative w-full bg-white dark:bg-zinc-950 min-h-[min(72vh,720px)] sm:min-h-[640px]">
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
