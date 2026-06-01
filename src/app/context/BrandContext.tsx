import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";
import type { BrandSiteConfig } from "../../brand-sites";
import { PEAK_SITE } from "../../brand-sites";
import {
  type ActiveBrand,
  PEAK_HEALTH_BRAND,
  parseBrandFromSearch,
  resolveActiveBrand,
} from "../../lib/brands";
import {
  applyBrandSiteTheme,
  clearBrandSiteTheme,
  resolveBrandExperience,
  type BrandExperience,
} from "../../lib/brands/whiteLabel";

export type BrandContextValue = BrandExperience & {
  brand: ActiveBrand;
  site: BrandSiteConfig;
  loading: boolean;
  orderBrandKey: string;
  refreshBrand: () => Promise<void>;
};

const BrandContext = createContext<BrandContextValue | null>(null);

function brandSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/care\/([^/]+)/);
  return m?.[1] ?? null;
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [brand, setBrand] = useState<ActiveBrand>(PEAK_HEALTH_BRAND);
  const [experience, setExperience] = useState<BrandExperience>(() =>
    resolveBrandExperience({}),
  );
  const [loading, setLoading] = useState(true);

  const syncBrand = useCallback(async () => {
    const hostname = typeof window !== "undefined" ? window.location.hostname : undefined;
    const pathSlug = brandSlugFromPath(location.pathname);
    const fromUrl = parseBrandFromSearch(location.search);
    const exp = resolveBrandExperience({
      brandSlug: pathSlug || fromUrl.brandSlug || fromUrl.brandId,
      hostname,
    });
    setExperience(exp);

    const resolved = await resolveActiveBrand({
      brandId: exp.site.brand.id,
      brandSlug: exp.site.brand.slug,
      hostname,
    });
    setBrand(resolved);
    setLoading(false);

    if (exp.isWhiteLabel) {
      applyBrandSiteTheme(exp.site);
    } else {
      clearBrandSiteTheme();
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    void syncBrand();
  }, [syncBrand]);

  const value = useMemo(
    (): BrandContextValue => ({
      ...experience,
      brand,
      site: experience.site,
      loading,
      orderBrandKey: brand.id,
      refreshBrand: syncBrand,
    }),
    [experience, brand, loading, syncBrand],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    const exp = resolveBrandExperience({});
    return {
      ...exp,
      brand: PEAK_HEALTH_BRAND,
      site: PEAK_SITE,
      loading: false,
      orderBrandKey: PEAK_HEALTH_BRAND.id,
      refreshBrand: async () => {},
    };
  }
  return ctx;
}
