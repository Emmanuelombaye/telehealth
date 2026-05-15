import { Shield } from "lucide-react";

export type AdminScopeNoticeVariant = "brand" | "platform";

/** Matches BRAND ADMIN & SUPER ADMIN architecture: non-clinical admin surfaces only. */
export function AdminScopeNotice({ variant }: { variant: AdminScopeNoticeVariant }) {
  const isBrand = variant === "brand";
  return (
    <div
      className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-4 py-3 sm:px-5 sm:py-4 text-[#0A2E1F] flex gap-3 items-start"
      role="status"
    >
      <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
      <div className="space-y-1 min-w-0">
        <p className="font-semibold text-sm leading-snug">
          {isBrand ? "Brand admin · non-clinical scope" : "Platform super admin · non-clinical scope"}
        </p>
        <p className="text-xs text-emerald-900/80 leading-relaxed">
          {isBrand
            ? "Tenant-scoped: orders and operational identifiers for your brand only. Medical intake, history, clinical notes, and prescriber free text are not shown in this portal."
            : "Cross-tenant operational and financial visibility. Clinical intake payloads, PHI, and provider decision narratives remain with clinical roles (doctor / patient)."}{" "}
          Prescription and visit status may appear as high-level fulfillment states only.
        </p>
      </div>
    </div>
  );
}
