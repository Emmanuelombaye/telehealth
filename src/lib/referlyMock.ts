import { referlyPartnerPortalUrl } from "./referly";

/** Demo affiliate profile — mirrors Referly partner fields for client previews. */
export const REFERLY_DEMO_PARTNER = {
  name: "Peak Affiliate Partner",
  email: "affiliate@peakbodyco.com",
  tier: "Emerald Partner",
  commission: "20% Lifetime RevShare",
  referralSlug: "peak-elite-2026",
  balance: 8440.5,
  lifetimeEarned: 124500,
  nextPayout: "May 31, 2026",
  clicks: 3840,
  conversions: 512,
  conversionRate: 13.3,
  ctr: 5.82,
};

export function buildPeakReferralLink(slug: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.peak-health.io";
  return `${origin}?ref=${slug}`;
}

export const REFERLY_SYNC_STATUS = {
  tracking: "Active",
  partnerPortal: referlyPartnerPortalUrl().replace("https://", ""),
  lastSync: "Just now",
  attribution: "Cookie + checkout convert",
} as const;

export const REFERLY_MOCK_REFERRALS = [
  { patient: "E.O.", time: "2m ago", product: "GLP-1 Program", commission: "$42.50", status: "Paid" as const },
  { patient: "J.D.", time: "14m ago", product: "Hair Restore", commission: "$18.00", status: "Pending" as const },
  { patient: "A.L.", time: "1h ago", product: "Bio-Optimizer", commission: "$24.00", status: "Paid" as const },
  { patient: "S.K.", time: "3h ago", product: "Longevity Pack", commission: "$35.00", status: "Paid" as const },
];

export const REFERLY_MOCK_PAYOUTS = [
  { date: "Apr 30, 2026", amount: "$6,240.00", method: "Referly Wallet", status: "Completed" as const },
  { date: "Mar 31, 2026", amount: "$5,880.00", method: "Referly Wallet", status: "Completed" as const },
  { date: "Feb 28, 2026", amount: "$4,920.00", method: "Referly Wallet", status: "Completed" as const },
];

export const REFERLY_MOCK_ASSETS = [
  { title: "Primary Brand Logo", type: "PNG / SVG", size: "12 MB" },
  { title: "GLP-1 Social Story Pack", type: "MP4", size: "45 MB" },
  { title: "Affiliate Playbook", type: "PDF", size: "2 MB" },
  { title: "Peak Health Color Kit", type: "Design", size: "1 MB" },
];

export const REFERLY_CHART_DATA = [
  { name: "W1", revenue: 4200, clicks: 2400 },
  { name: "W2", revenue: 6800, clicks: 3100 },
  { name: "W3", revenue: 9800, clicks: 4500 },
  { name: "W4", revenue: 7200, clicks: 3900 },
  { name: "W5", revenue: 11000, clicks: 4800 },
  { name: "W6", revenue: 12400, clicks: 5200 },
];
