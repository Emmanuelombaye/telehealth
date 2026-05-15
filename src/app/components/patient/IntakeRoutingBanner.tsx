import { motion } from "framer-motion";
import { Video, FileText } from "lucide-react";
import { cn } from "../ui/utils";
import type { EnrollmentVideoRouting } from "../../../lib/enrollVideoRouting";

export function IntakeRoutingBanner({
  routing,
  className,
}: {
  routing: EnrollmentVideoRouting;
  className?: string;
}) {
  const isVideo = routing.requiresSyncVideo;

  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        isVideo
          ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 via-white to-emerald-50/40"
          : "border-slate-200/90 bg-gradient-to-br from-slate-50/95 via-white to-slate-50/40",
        className,
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div className="flex gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isVideo ? "bg-emerald-600 text-white" : "bg-slate-700 text-white",
          )}
        >
          {isVideo ? <Video className="h-5 w-5" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/80">
            {isVideo ? "Path A · Video visit required" : "Path B · Async clinical review"}
          </p>
          <p className="text-sm font-semibold leading-snug text-[#0A0D14]">{routing.headline}</p>
          {routing.reasons.length > 0 ? (
            <ul className="space-y-1 text-xs leading-relaxed text-slate-600">
              {routing.reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-emerald-600" aria-hidden>
                    •
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {isVideo ? (
            <p className="text-[11px] text-slate-500">
              Scheduling uses your clinician&apos;s Calendly or Cal.com calendar. Zoom or Google Meet links are
              created automatically when you book.
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              You will receive updates in your patient portal when your case is reviewed — typically within a few
              hours.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
