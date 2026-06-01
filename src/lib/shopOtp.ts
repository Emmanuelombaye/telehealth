/** Real Twilio SMS OTP — only when deployed + secrets set. Otherwise shop uses demo 6-digit bypass. */
export function isShopLiveOtpEnabled(): boolean {
  return import.meta.env.VITE_SHOP_LIVE_OTP === "true";
}
