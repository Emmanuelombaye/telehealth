import { motion } from "framer-motion";
import { cn } from "../ui/utils";

const sizeClass: Record<"sm" | "md" | "lg" | "hero", string> = {
  sm: "h-11 max-h-11",
  md: "h-14 max-h-14 md:h-16 md:max-h-16",
  lg: "h-16 max-h-16 md:h-20 md:max-h-20",
  hero: "h-20 max-h-20 md:h-24 md:max-h-24",
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
      className={cn("flex flex-col items-center text-center", className)}
    >
      <div
        className={cn(
          "rounded-2xl bg-white/95 p-3 md:p-4 shadow-lg shadow-emerald-900/[0.07]",
          "ring-1 ring-emerald-600/15 border border-white/90 backdrop-blur-sm",
        )}
      >
        <img
          src="/PeakHealthLogo.png"
          alt="Peak Health"
          className={cn(sizeClass[size], "w-auto object-contain object-center mx-auto")}
          width={320}
          height={120}
          decoding="async"
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
