/** Real Twilio SMS OTP — off by default (mock enrollment). Set VITE_SHOP_LIVE_OTP=true when send-otp is deployed. */
export function isShopLiveOtpEnabled(): boolean {
  return import.meta.env.VITE_SHOP_LIVE_OTP === "true";
}

/** Mock enrollment skips the SMS code step entirely. */
export function isShopMockOtp(): boolean {
  return !isShopLiveOtpEnabled();
}
