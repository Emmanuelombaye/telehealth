import { useEffect, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router";
import { getBrandSiteBySlug, listRegisteredCareBrandSlugs } from "../../../brand-sites";
import { supabase } from "../../../lib/supabaseClient";
import { AuthLoadingScreen } from "../ProtectedRoute";

async function isActiveBrandSlug(slug: string): Promise<boolean> {
  const normalized = slug.trim().toLowerCase();
  if (listRegisteredCareBrandSlugs().includes(normalized)) return true;
  if (normalized === "peak-health") return false;

  try {
    const { data, error } = await supabase
      .from("brands")
      .select("slug")
      .eq("slug", normalized)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.slug);
  } catch {
    return false;
  }
}

/** Ensures /care/:brandSlug/* is a registered partner tenant (static kit or Supabase brands row). */
export function BrandSiteGate() {
  const { brandSlug } = useParams();
  const [allowed, setAllowed] = useState<boolean | null>(() => {
    if (!brandSlug) return false;
    return getBrandSiteBySlug(brandSlug) ? true : null;
  });

  useEffect(() => {
    if (!brandSlug) {
      setAllowed(false);
      return;
    }
    if (getBrandSiteBySlug(brandSlug)) {
      setAllowed(true);
      return;
    }
    let cancelled = false;
    void isActiveBrandSlug(brandSlug).then((ok) => {
      if (!cancelled) setAllowed(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [brandSlug]);

  if (allowed === null) return <AuthLoadingScreen />;
  if (!allowed) return <Navigate to="/" replace />;
  return <Outlet />;
}
