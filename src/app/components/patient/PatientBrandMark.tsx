import { motion } from "framer-motion";
import { cn } from "../ui/utils";

const sizeClass: Record<"sm" | "md" | "lg" | "hero", string> = {
  sm: "h-11 max-h-11 w-auto sm:h-12 sm:max-h-12",
  md: "h-12 max-h-12 w-auto sm:h-14 sm:max-h-14 md:h-[4rem] md:max-h-[4rem]",
  lg: "h-14 max-h-14 w-auto sm:h-16 sm:max-h-16 md:h-[4.5rem] md:max-h-[4.5rem]",
  hero: "h-16 max-h-16 w-auto sm:h-20 sm:max-h-20 md:h-24 md:max-h-24",
};

type PatientBrandMarkProps = {
  size?: keyof typeof sizeClass;
  showTagline?: boolean;
  className?: string;
};

/**
 * Peak Health mark for shop flows — plain image, no “card” frame (header carries primary branding).
 */
export function PatientBrandMark({ size = "md", showTagline = false, className }: PatientBrandMarkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("inline-flex flex-col items-center", className)}
    >
      <img
        src="/PeakHealthLogo.png"
        alt="Peak Health"
        className={cn(sizeClass[size], "object-contain object-center")}
        width={320}
        height={120}
        decoding="async"
        fetchPriority={size === "hero" ? "high" : undefined}
      />
      {showTagline ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-800/75"
        >
          Clinical care, online
        </motion.span>
      ) : null}
    </motion.div>
  );
}
