import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, ExternalLink, Loader2, Video } from "lucide-react";
import { Badge, Button, Card, CardContent, cn } from "../ui/shared.tsx";
import {
  detectSchedulingProvider,
  toSchedulingOpenTabUrl,
  type SchedulingProvider,
} from "../../../lib/calendlyEmbed";
import {
  getMockSchedulingSlots,
  isMockSchedulingEnabled,
  MOCK_SCHEDULING_PROVIDER_LABEL,
  type MockSchedulingSlot,
} from "../../../lib/mockScheduling";

const CALENDLY_MESSAGE_ORIGINS = new Set(["https://calendly.com", "https://www.calendly.com"]);

function providerBadgeLabel(p: SchedulingProvider, mock: boolean): string {
  if (mock) return MOCK_SCHEDULING_PROVIDER_LABEL;
  if (p === "calendly") return "Calendly";
  if (p === "calcom") return "Cal.com";
  return "Scheduler";
}

export type PatientSchedulingPanelProps = {
  /** Full iframe `src` (live Calendly / Cal.com only). Omit in mock mode. */
  embedSrc?: string | null;
  /** Raw booking base URL for provider detection (doctor/product link). */
  rawBookingUrl?: string | null;
  doctorName?: string | null;
  doctorHint?: string | null;
  doctorMatchPending?: boolean;
  schedulingRefTail?: string | null;
  onCalendlyBookingConfirmed?: () => void;
  /** Mock mode: patient picked a demo slot. */
  onMockSlotSelected?: (slot: MockSchedulingSlot) => void;
  className?: string;
};

export function PatientSchedulingPanel({
  embedSrc,
  rawBookingUrl = "",
  doctorName,
  doctorHint,
  doctorMatchPending,
  schedulingRefTail,
  onCalendlyBookingConfirmed,
  onMockSlotSelected,
  className,
}: PatientSchedulingPanelProps) {
  const mock = isMockSchedulingEnabled();
  const slots = useMemo(() => (mock ? getMockSchedulingSlots() : []), [mock]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const provider = mock ? "unknown" : detectSchedulingProvider(rawBookingUrl);
  const openTabUrl =
    !mock && embedSrc
      ? toSchedulingOpenTabUrl(embedSrc) || toSchedulingOpenTabUrl(rawBookingUrl) || embedSrc
      : null;
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
  }, [embedSrc]);

  useEffect(() => {
    if (mock || !onCalendlyBookingConfirmed || provider !== "calendly") return;
    const onMessage = (e: MessageEvent) => {
      if (!CALENDLY_MESSAGE_ORIGINS.has(e.origin)) return;
      const ev = e.data;
      if (ev && typeof ev === "object" && "event" in ev && (ev as { event?: string }).event === "calendly.event_scheduled") {
        onCalendlyBookingConfirmed();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onCalendlyBookingConfirmed, provider, mock]);

  const confirmMockSlot = (slot: MockSchedulingSlot) => {
    setSelectedSlotId(slot.id);
    onMockSlotSelected?.(slot);
    onCalendlyBookingConfirmed?.();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Step 8 of 9 · Intake</p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold tracking-tight">Schedule your video visit</h2>
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wide">
              {providerBadgeLabel(provider, mock)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-prose">
            {mock ? (
              <>
                Pick a demo time below to continue enrollment. No external calendar is loaded — meeting details are
                simulated until live scheduling is enabled.
              </>
            ) : (
              <>
                Your program requires a live video consultation. Pick a time below —{" "}
                <strong className="text-foreground font-medium">Zoom or Google Meet</strong> is created automatically
                when you confirm.
              </>
            )}
          </p>
        </div>
        {!mock && openTabUrl ? (
          <a
            href={openTabUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-transparent px-4 text-[10px] font-black uppercase tracking-widest text-[#0A0D14] transition-colors hover:bg-[#F8FAFC]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]",
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in browser
          </a>
        ) : null}
      </div>

      {!mock && (
        <ol className="grid gap-2 md:grid-cols-3 text-xs text-slate-600">
          <li className="flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
              1
            </span>
            <span>
              <span className="font-semibold text-slate-900">Choose a time</span> in the calendar.
            </span>
          </li>
          <li className="flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
              2
            </span>
            <span>
              <span className="font-semibold text-slate-900">Confirm</span> — meeting link is sent by your scheduler.
            </span>
          </li>
          <li className="flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
              3
            </span>
            <span>
              <span className="font-semibold text-slate-900">Check the box</span> below before submitting enrollment.
            </span>
          </li>
        </ol>
      )}

      {doctorMatchPending && !mock && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>
            <span className="font-semibold">Matching your clinician…</span>
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
            <span className="font-semibold text-slate-900">
              {mock ? "Demo availability" : "Book with our clinical team"}
            </span>
          </div>

          {mock ? (
            <div className="p-4 sm:p-6 space-y-3">
              <p className="text-xs text-slate-500">Select any slot — demo only, no SMS or calendar invite is sent.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {slots.map((slot) => {
                  const picked = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => confirmMockSlot(slot)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                        picked
                          ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/30"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40",
                      )}
                    >
                      <span>
                        <span className="block font-semibold text-slate-900">{slot.dayLabel}</span>
                        <span className="block text-xs text-slate-500">{slot.timeLabel} · 20 min video</span>
                      </span>
                      {picked ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Select</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : embedSrc ? (
            <div className="relative w-full bg-white min-h-[min(72vh,720px)] sm:min-h-[640px]">
              {!iframeLoaded && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-[2px]"
                  aria-busy="true"
                  aria-label="Loading scheduler"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Loading calendar…</p>
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
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No scheduling URL configured. Add a doctor Cal.com/Calendly link or set{" "}
              <code className="text-xs">VITE_USE_LIVE_SCHEDULING=true</code>.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
