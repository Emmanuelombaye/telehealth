/** Canonical login URLs for each staff/partner portal. */
export const PORTAL_LOGINS = {
  patient: "/login",
  doctor: "/providers/login",
  admin: "/admin/login",
  superadmin: "/superadmin/login",
  affiliate: "/affiliate/login",
} as const;

export type PortalKey = keyof typeof PORTAL_LOGINS;

/** Protected app roots (post-login). */
export const PORTAL_HOME = {
  patient: "/patient",
  doctor: "/providers",
  admin: "/admin",
  superadmin: "/superadmin",
  affiliate: "/affiliate",
} as const;

/** Shown in marketing footer / support — links to the right login, not patient `/login`. */
export const MARKETING_PORTAL_LINKS: { label: string; href: string; description?: string }[] = [
  { label: "Patient Portal", href: PORTAL_LOGINS.patient },
  { label: "Provider Portal", href: PORTAL_LOGINS.doctor },
  { label: "Admin Portal", href: PORTAL_LOGINS.admin },
  { label: "Affiliate Portal", href: PORTAL_LOGINS.affiliate },
  { label: "Super Admin", href: PORTAL_LOGINS.superadmin },
];
