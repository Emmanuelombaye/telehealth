import { Navigate, useSearchParams } from "react-router";
import { DEFAULT_BRAND_ID } from "../../components/os/constants";

/** Mirrors live `/auth/register?brandId=…` → patient enrollment entry */
export function OsRegisterRedirect() {
  const [params] = useSearchParams();
  const brandId = params.get("brandId") || DEFAULT_BRAND_ID;
  return <Navigate to={`/patient/shop?brandId=${encodeURIComponent(brandId)}`} replace />;
}
