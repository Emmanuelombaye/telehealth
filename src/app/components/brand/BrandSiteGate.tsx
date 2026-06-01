import { Navigate, Outlet, useParams } from "react-router";
import { getBrandSiteBySlug } from "../../../brand-sites";

/** Ensures /care/:brandSlug/* is a registered partner site. */
export function BrandSiteGate() {
  const { brandSlug } = useParams();
  const site = brandSlug ? getBrandSiteBySlug(brandSlug) : null;
  if (!site) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
