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
        "rounded-2xl border bg-white p-4 sm:p-5 shadow-sm",
        isVideo ? "border-emerald-200/90" : "border-slate-200/90",
        className,
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div className="flex gap-3 sm:gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isVideo ? "bg-emerald-700 text-white" : "bg-slate-700 text-white",
          )}
        >
          {isVideo ? <Video className="h-5 w-5" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
            {isVideo ? "Video visit required" : "Clinical review"}
          </p>
          <p className="text-sm font-semibold leading-snug text-slate-900">{routing.headline}</p>
          {routing.reasons.length > 0 ? (
            <ul className="space-y-1.5 text-sm leading-relaxed text-slate-600">
              {routing.reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-emerald-600 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {isVideo ? (
            <p className="text-xs text-slate-500">
              Choose a time below. Your clinician&apos;s scheduler sends the Zoom or Google Meet link when you
              confirm.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              You will receive updates in your patient portal when your case is reviewed — typically within a few
              hours.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
