import { motion } from "framer-motion";
import { cn } from "../ui/utils";

const sizeClass: Record<"sm" | "md" | "lg" | "hero", string> = {
  sm: "h-10 max-h-10 sm:h-11 sm:max-h-11",
  md: "h-12 max-h-12 sm:h-14 sm:max-h-14 md:h-16 md:max-h-16",
  lg: "h-14 max-h-14 sm:h-16 sm:max-h-16 md:h-20 md:max-h-20",
  hero: "h-[4.25rem] max-h-[4.25rem] sm:h-20 sm:max-h-20 md:h-24 md:max-h-24",
};

type PatientBrandMarkProps = {
  size?: keyof typeof sizeClass;
  showTagline?: boolean;
  className?: string;
};

/**
 * Consistent Peak Health mark for patient shop + portal (matches header asset).
 */
export function PatientBrandMark({ size = "md", showTagline = false, className }: PatientBrandMarkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("inline-flex flex-col items-center", className)}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3 md:p-3.5",
          "shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_12px_40px_-12px_rgba(6,78,59,0.25)]",
          "ring-1 ring-emerald-900/[0.06] border border-emerald-100/70",
        )}
      >
        <img
          src="/PeakHealthLogo.png"
          alt="Peak Health"
          className={cn(sizeClass[size], "w-auto max-w-full object-contain object-center")}
          width={280}
          height={96}
          decoding="async"
          fetchPriority={size === "hero" ? "high" : undefined}
        />
      </div>
      {showTagline ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-2 text-[10px] font-black uppercase tracking-[0.32em] text-emerald-800/75"
        >
          Clinical care, online
        </motion.span>
      ) : null}
    </motion.div>
  );
}
