import { Navigate, useSearchParams } from "react-router";
import { DEFAULT_BRAND_ID } from "../../components/os/constants";

/** Mirrors live `/auth/register?brandId=…` or `?brand=slug` → patient enrollment entry */
export function OsRegisterRedirect() {
  const [params] = useSearchParams();
  const brandId = params.get("brandId");
  const brandSlug = params.get("brand") || params.get("slug");
  const q = brandId
    ? `brandId=${encodeURIComponent(brandId)}`
    : brandSlug
      ? `brand=${encodeURIComponent(brandSlug)}`
      : `brandId=${encodeURIComponent(DEFAULT_BRAND_ID)}`;
  return <Navigate to={`/patient/shop?${q}`} replace />;
}
