import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "./auth-store";

export type StaffDemoAccount = {
  email: string;
  password: string;
  role: Exclude<Role, null>;
  displayName: string;
  brandId?: string;
};

export type StaffPortal = "doctor" | "admin" | "superadmin" | "pharmacy" | "affiliate";

/** Demo credentials for client UAT — used when Supabase sign-in fails or credentials match. */
export const STAFF_DEMO_ACCOUNTS: StaffDemoAccount[] = [
  {
    email: "doctor@peakbodyco.com",
    password: "password123",
    role: "doctor",
    displayName: "Clinical Provider",
  },
  {
    email: "admin@peakbodyco.com",
    password: "password123",
    role: "brand_admin",
    displayName: "Brand Administrator",
    brandId: "peak",
  },
  {
    email: "brandon@peakbodyco.com",
    password: "@incorrect!",
    role: "super_admin",
    displayName: "Brandon Admin",
  },
  {
    email: "pharmacy@peakbodyco.com",
    password: "password123",
    role: "pharmacy",
    displayName: "Pharmacy Fulfillment",
  },
  {
    email: "affiliate@peakbodyco.com",
    password: "password123",
    role: "affiliate",
    displayName: "Affiliate Partner",
  },
];

const PORTAL_DEMO_EMAIL: Record<StaffPortal, string> = {
  superadmin: "brandon@peakbodyco.com",
  doctor: "doctor@peakbodyco.com",
  admin: "admin@peakbodyco.com",
  pharmacy: "pharmacy@peakbodyco.com",
  affiliate: "affiliate@peakbodyco.com",
};

export const DEMO_ROLE_KEY = "peak_health_dev_role";
export const DEMO_EMAIL_KEY = "peak_health_demo_email";

export function isStaffPortal(portal: string): portal is StaffPortal {
  return portal in PORTAL_DEMO_EMAIL;
}

export function demoAccountForPortal(portal: StaffPortal): StaffDemoAccount {
  const email = PORTAL_DEMO_EMAIL[portal];
  const account = STAFF_DEMO_ACCOUNTS.find((a) => a.email === email);
  if (!account) throw new Error(`No demo account for portal: ${portal}`);
  return account;
}

export function demoRoleAllowedOnPortal(portal: StaffPortal, role: Role): boolean {
  if (role === "super_admin") return true;
  switch (portal) {
    case "superadmin":
      return role === "super_admin";
    case "doctor":
      return role === "doctor";
    case "admin":
      return role === "brand_admin";
    case "pharmacy":
      return role === "pharmacy" || role === "doctor" || role === "brand_admin";
    case "affiliate":
      return role === "affiliate";
    default:
      return false;
  }
}

export function matchStaffDemo(email: string, password: string): StaffDemoAccount | null {
  const normalized = email.trim().toLowerCase();
  const account = STAFF_DEMO_ACCOUNTS.find((a) => a.email === normalized);
  if (!account || account.password !== password) return null;
  return account;
}

export function readStoredDemoAuth(): { role: Role; email: string } | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(DEMO_ROLE_KEY) as Role | null;
  const email = localStorage.getItem(DEMO_EMAIL_KEY);
  if (!role || !email) return null;
  return { role, email };
}

export function persistDemoAuth(account: StaffDemoAccount): void {
  localStorage.setItem(DEMO_ROLE_KEY, account.role);
  localStorage.setItem(DEMO_EMAIL_KEY, account.email);
}

export function clearDemoAuth(): void {
  localStorage.removeItem(DEMO_ROLE_KEY);
  localStorage.removeItem(DEMO_EMAIL_KEY);
}

export function buildDemoUser(account: StaffDemoAccount): User {
  const [first, ...rest] = account.displayName.split(" ");
  return {
    id: `demo-${account.role}-${account.email}`,
    email: account.email,
    user_metadata: {
      first_name: first,
      last_name: rest.join(" ") || "",
      full_name: account.displayName,
      role: account.role,
      ...(account.brandId ? { brand_id: account.brandId } : {}),
    },
    app_metadata: {
      role: account.role,
      ...(account.brandId ? { brand_id: account.brandId } : {}),
    },
  } as User;
}

export function demoUserFromStorage(): User | null {
  const stored = readStoredDemoAuth();
  if (!stored?.role) return null;
  const account = STAFF_DEMO_ACCOUNTS.find((a) => a.email === stored.email);
  if (!account) return null;
  return buildDemoUser(account);
}

/** Client-side demo login uses synthetic ids like `demo-super_admin-...` (not UUIDs). */
export function isDemoUser(user: User | null | undefined): boolean {
  return !!user?.id?.startsWith("demo-");
}

/** Skip user-scoped Supabase reads when logged in via demo auth without a real JWT session. */
export function isDemoAuthWithoutSession(
  user: User | null | undefined,
  session: Session | null | undefined,
): boolean {
  return isDemoUser(user) && !session;
}

/** Wrong portal demo account — message names the account this portal expects. */
export function portalDemoMismatchMessage(portal: StaffPortal): string {
  const expected = demoAccountForPortal(portal);
  return `Use the ${portal} demo account: ${expected.displayName} (${expected.email}).`;
}
