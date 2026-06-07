import { useEffect } from "react";
import { useBrand } from "../../context/BrandContext";
import { resolvePatientShopDestination } from "../../../lib/partners/catalogRouting";
import { cn } from "../ui/utils";

/**
 * Blocks Peak product catalog for partners that own catalog on their marketing site.
 * Mount at top of PatientShopPage.
 */
export function PartnerExternalShopRedirect() {
  const { brand, enrollBase, site } = useBrand();
  const shop = resolvePatientShopDestination(brand.slug, enrollBase);

  useEffect(() => {
    if (shop.external) {
      window.location.replace(shop.href);
    }
  }, [shop.external, shop.href]);

  if (!shop.external) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 p-6 text-center"
      style={{ backgroundColor: site.theme.headerBg }}
    >
      <img
        src={brand.logoUrl}
        alt={brand.logoAlt}
        className="h-16 w-16 rounded-2xl object-contain bg-white shadow-sm"
      />
      <p className="max-w-md text-sm text-slate-600 leading-relaxed">
        {shop.helperText ?? `Redirecting to ${site.copy.portalName}…`}
      </p>
      <span
        className={cn(
          "h-6 w-6 border-2 border-slate-200 rounded-full animate-spin",
        )}
        style={{ borderTopColor: site.theme.primary }}
      />
      <a
        href={shop.href}
        className="text-sm font-semibold underline"
        style={{ color: site.theme.primary }}
      >
        Continue to {site.copy.portalName} plans →
      </a>
    </div>
  );
}
