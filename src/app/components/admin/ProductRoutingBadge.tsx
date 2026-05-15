import { motion } from "framer-motion";
import { Video, FileText, AlertTriangle } from "lucide-react";
import { cn } from "../ui/utils";
import type { ProductRoutingProfile } from "../../../lib/productRoutingProfile";

export function ProductRoutingBadge({
  profile,
  className,
  size = "sm",
}: {
  profile: ProductRoutingProfile;
  className?: string;
  size?: "sm" | "md";
}) {
  const isVideo = profile.pathLabel === "video";
  const warn = profile.mode === "calendar_only";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border font-bold uppercase tracking-wider",
        size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]",
        warn && "border-amber-300 bg-amber-50 text-amber-900",
        !warn && isVideo && "border-emerald-300 bg-emerald-50 text-emerald-900",
        !warn && !isVideo && "border-slate-200 bg-slate-50 text-slate-600",
        className,
      )}
      title={profile.summary}
    >
      {warn ? (
        <AlertTriangle className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      ) : isVideo ? (
        <Video className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      ) : (
        <FileText className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      )}
      {profile.badgeLabel}
    </span>
  );
}

export function ProductRoutingProfileCard({ profile }: { profile: ProductRoutingProfile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-4 space-y-3",
        profile.mode === "calendar_only"
          ? "border-amber-200 bg-amber-50/80"
          : profile.pathLabel === "video"
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-slate-200 bg-slate-50/80",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enrollment routing preview</p>
        <ProductRoutingBadge profile={profile} size="md" />
      </div>
      <p className="text-sm font-medium leading-relaxed text-slate-800">{profile.summary}</p>
      <ul className="space-y-1 text-xs text-slate-600">
        {profile.triggers.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="text-emerald-600" aria-hidden>
              •
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        {profile.hasCalendarUrl
          ? "Calendly/Cal.com URL is configured for Path A patients."
          : "No product calendar URL — Path A patients use the assigned doctor’s calendar or env default."}
        {" "}
        Global <code className="rounded bg-white/80 px-1">VITE_VIDEO_REQUIRED_STATES</code> and{" "}
        <code className="rounded bg-white/80 px-1">consult_routing_rules</code> can still force video.
      </p>
    </motion.div>
  );
}
