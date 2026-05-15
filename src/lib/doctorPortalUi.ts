/**
 * Tailwind utility bundles for the doctor portal — forest green primary,
 * emerald/teal mid-tones, gold accent, restrained violet/cyan highlights.
 */

export const DR_FOREST = "#0A2E1F";
export const DR_GOLD = "#D4AF37";
export const DR_TEAL = "#0d9488";

export const doctorPortalBackground = [
  "min-h-full",
  "bg-gradient-to-br from-emerald-50/95 via-[#f4faf7] to-cyan-50/50",
].join(" ");

export const doctorMainBackground = ["bg-transparent", "relative"].join(" ");

/** Page container — consistent horizontal rhythm */
export const doctorPageContainer = `max-w-[1600px] mx-auto w-full`;

/** Raised glass card — default surface */
export const doctorSurfaceCard = [
  "rounded-[1.5rem] border border-emerald-100/80 bg-white/90 shadow-sm",
  "shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_40px_-12px_rgba(10,46,31,0.08)]",
  "backdrop-blur-[2px]",
].join(" ");

/** Compact inner card inside surfaces */
export const doctorInsetCard =
  "rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0_2px_12px_rgba(10,46,31,0.04)]";
