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
import {
  type ActiveBrand,
  PEAK_HEALTH_BRAND,
  parseBrandFromSearch,
  resolveActiveBrand,
} from "../../lib/brands";

type BrandContextValue = {
  brand: ActiveBrand;
  loading: boolean;
  /** Value for orders.sub_brand and profiles.brand_id (UUID). */
  orderBrandKey: string;
  refreshBrand: () => Promise<void>;
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [brand, setBrand] = useState<ActiveBrand>(PEAK_HEALTH_BRAND);
  const [loading, setLoading] = useState(true);

  const refreshBrand = useCallback(async () => {
    const fromUrl = parseBrandFromSearch(location.search);
    const resolved = await resolveActiveBrand({
      ...fromUrl,
      hostname: typeof window !== "undefined" ? window.location.hostname : undefined,
    });
    setBrand(resolved);
    setLoading(false);
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const fromUrl = parseBrandFromSearch(location.search);
      const resolved = await resolveActiveBrand({
        ...fromUrl,
        hostname: typeof window !== "undefined" ? window.location.hostname : undefined,
      });
      if (!cancelled) {
        setBrand(resolved);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.search, location.pathname]);

  const value = useMemo(
    () => ({
      brand,
      loading,
      orderBrandKey: brand.id,
      refreshBrand,
    }),
    [brand, loading, refreshBrand],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    return {
      brand: PEAK_HEALTH_BRAND,
      loading: false,
      orderBrandKey: PEAK_HEALTH_BRAND.id,
      refreshBrand: async () => {},
    };
  }
  return ctx;
}
