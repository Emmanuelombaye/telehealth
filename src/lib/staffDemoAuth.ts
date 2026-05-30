import type { User } from "@supabase/supabase-js";
import type { Role } from "./auth-store";

export type StaffDemoAccount = {
  email: string;
  password: string;
  role: Exclude<Role, null>;
  displayName: string;
};

/** Demo credentials for client UAT — used when Supabase sign-in fails but password matches. */
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

export const DEMO_ROLE_KEY = "peak_health_dev_role";
export const DEMO_EMAIL_KEY = "peak_health_demo_email";

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
    },
    app_metadata: { role: account.role },
  } as User;
}

export function demoUserFromStorage(): User | null {
  const stored = readStoredDemoAuth();
  if (!stored?.role) return null;
  const account = STAFF_DEMO_ACCOUNTS.find((a) => a.email === stored.email);
  if (!account) return null;
  return buildDemoUser(account);
}
