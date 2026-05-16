import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router";
import {
  LayoutDashboard, Users, Calendar, MessageSquare, ClipboardList,
  FileText, Settings, LogOut, Stethoscope, Activity, ShieldCheck,
  CreditCard, FlaskConical, X, TrendingUp, Package, Wrench,
  HelpCircle, Tag, Share2, BarChart3, Layers, Home,
  Bell, User, Heart, FolderOpen, Pill, TestTube, UserCheck, UserCog,
  FileCheck, Receipt, BookOpen, Building2, Truck,
  Image as ImageIcon, ArrowRightLeft, Bot, HeartPulse, ScrollText, Map
} from "lucide-react";
import { cn } from "./ui/shared.tsx";
import { useI18n } from "../../lib/i18n.tsx";
import { brand } from "../../lib/patient-store";
import { useAuthStore } from "../../lib/auth-store";
import { usePatientStore } from "../../lib/patient-store";
import { LogoutConfirmation } from "./LogoutConfirmation";
import { motion, AnimatePresence } from "framer-motion";
import { doctorPortalBaseFromPath } from "../../lib/doctorPortalBase";

type DoctorNavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

function buildDoctorMenu(base: "/doctor" | "/providers"): Array<DoctorNavItem & { href: string }> {
  const p = (path: string) => `${base}${path}`;
  return [
    { icon: LayoutDashboard, label: "Dashboard", href: base },
    { icon: Map, label: "Workflow map", href: p("/workflow") },
    { icon: Users, label: "Patients", href: p("/patients") },
    { icon: ClipboardList, label: "Patient Queue", href: p("/queue") },
    { icon: Calendar, label: "Schedule", href: p("/schedule") },
    { icon: Activity, label: "Availability", href: p("/availability") },
    { icon: MessageSquare, label: "Messages", href: p("/messages") },
    { icon: Stethoscope, label: "Consultation", href: p("/consult") },
    { icon: FlaskConical, label: "Lab Requests", href: p("/labs") },
    { icon: Bot, label: "AI Scribe", href: p("/scribe") },
    { icon: Pill, label: "e-Prescribing", href: p("/erx") },
    { icon: BookOpen, label: "Education", href: p("/education") },
  ];
}

type Role = "patient" | "doctor" | "admin" | "superadmin" | "affiliate";

/** Patient leaf routes share `/patient`; without correct `end`, NavLink falsely matches unrelated pages. */
function navLinkEndsAtExact(role: Role, doctorBase: "/doctor" | "/providers" | null, itemHref: string): boolean {
  if (role === "doctor" && doctorBase) return itemHref === doctorBase;
  if (role === "patient") {
    if (itemHref === "/patient") return true;
    /** Shop + enrollment steps live under `/patient/shop/...` */
    if (itemHref === "/patient/shop" || itemHref.startsWith("/patient/shop/")) return false;
    return true;
  }
  if (role === "admin") return itemHref === "/admin";
  if (role === "superadmin") return itemHref === "/superadmin";
  if (role === "affiliate") return itemHref === "/affiliate";
  return false;
}

interface SidebarProps {
  role: Role;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuConfig: Record<Role, any[]> = {
  patient: [
    { icon: Home, label: "Overview", href: "/patient" },
    { icon: Package, label: "Shop Treatments", href: "/patient/shop" },
    { icon: TrendingUp, label: "My Orders", href: "/patient/orders" },
    { icon: Calendar, label: "Appointments", href: "/patient/appointments" },
    { icon: FileCheck, label: "Intake Forms", href: "/patient/intake" },
    { icon: ClipboardList, label: "Visit Forms", href: "/patient/visit-forms" },
    { icon: MessageSquare, label: "Messages", href: "/patient/messages" },
    { icon: FileText, label: "Visit Summaries", href: "/patient/summaries" },
    { icon: Pill, label: "Prescriptions", href: "/patient/prescriptions" },
    { icon: TestTube, label: "Lab Results", href: "/patient/labs" },
    { icon: FolderOpen, label: "Documents", href: "/patient/documents" },
    { icon: User, label: "Profile", href: "/patient/profile" },
    { icon: ShieldCheck, label: "Identity", href: "/patient/identity" },
    { icon: Users, label: "Family Access", href: "/patient/family" },
    { icon: Bell, label: "Notifications", href: "/patient/notifications" },
    { icon: Building2, label: "Insurance", href: "/patient/insurance" },
  ],
  doctor: [], // built at render from /doctor vs /providers prefix
  admin: [
    { group: "CORE · NON-CLINICAL", icon: Home, label: "Dashboard", href: "/admin" },
    { group: "CORE · NON-CLINICAL", icon: Package, label: "Manage orders", href: "/admin/orders" },
    { group: "CORE · NON-CLINICAL", icon: Users, label: "Patients (operations)", href: "/admin/patients" },
    { group: "CORE · NON-CLINICAL", icon: MessageSquare, label: "Messaging & support", href: "/admin/messages" },
    { group: "CORE · NON-CLINICAL", icon: CreditCard, label: "Financials & reports", href: "/admin/finance" },
    { group: "CORE · NON-CLINICAL", icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { group: "GOVERNANCE", icon: ScrollText, label: "Audit logs", href: "/admin/audit" },
    { group: "PROGRAM CONFIG", icon: HeartPulse, label: "Treatments", href: "/admin/treatments" },
    { group: "PROGRAM CONFIG", icon: Layers, label: "Products & inventory", href: "/admin/products" },
    { group: "PROGRAM CONFIG", icon: FileText, label: "Questionnaires", href: "/admin/questionnaires" },
    { group: "PROGRAM CONFIG", icon: Wrench, label: "Builders", href: "/admin/builders" },
    { group: "SALES CHANNELS", icon: Tag, label: "Discounts", href: "/admin/discounts" },
    { group: "SALES CHANNELS", icon: Share2, label: "Affiliates", href: "/admin/affiliates" },
    { group: "BOTTOM", icon: Settings, label: "Settings", href: "/admin/settings" },
  ],
  /** Grouped Nav mirrors brand-admin structure: same capabilities, wider data scope */
  superadmin: [
    { group: "PLATFORM CORE", icon: LayoutDashboard, label: "Global dashboard", href: "/superadmin" },
    { group: "PLATFORM CORE", icon: Building2, label: "Brand management", href: "/superadmin/brands" },
    { group: "PIPELINE", icon: Package, label: "Platform orders", href: "/superadmin/orders" },
    { group: "PIPELINE", icon: Users, label: "Patients (operations)", href: "/superadmin/patients" },
    { group: "PIPELINE", icon: MessageSquare, label: "Messaging & support", href: "/superadmin/messages" },
    { group: "PIPELINE", icon: CreditCard, label: "Finance", href: "/superadmin/finance" },
    { group: "PIPELINE", icon: BarChart3, label: "Analytics", href: "/superadmin/analytics" },
    { group: "GOVERNANCE", icon: ScrollText, label: "Audit logs", href: "/superadmin/audit" },
    { group: "PROGRAM CONFIG", icon: Layers, label: "Products & protocols", href: "/superadmin/products" },
    { group: "PROGRAM CONFIG", icon: HeartPulse, label: "Treatments", href: "/superadmin/treatments" },
    { group: "PROGRAM CONFIG", icon: FileText, label: "Questionnaires", href: "/superadmin/questionnaires" },
    { group: "PROGRAM CONFIG", icon: Wrench, label: "Builders", href: "/superadmin/builders" },
    { group: "TOOLS", icon: FlaskConical, label: "Platform tools", href: "/superadmin/tools" },
    { group: "SALES CHANNELS", icon: Tag, label: "Discounts", href: "/superadmin/discounts" },
    { group: "SALES CHANNELS", icon: Share2, label: "Affiliates", href: "/superadmin/affiliates" },
    { group: "PEOPLE & ACCESS", icon: Stethoscope, label: "Doctors & providers", href: "/superadmin/doctors" },
    { group: "PEOPLE & ACCESS", icon: UserCog, label: "All users", href: "/superadmin/users" },
    { group: "PEOPLE & ACCESS", icon: ShieldCheck, label: "Security & compliance", href: "/superadmin/security" },
    { group: "BOTTOM", icon: Settings, label: "Platform settings", href: "/superadmin/settings" },
  ],
  affiliate: [
    { icon: Home, label: "Overview", href: "/affiliate" },
    { icon: Share2, label: "My Referrals", href: "/affiliate/referrals" },
    { icon: CreditCard, label: "Payouts", href: "/affiliate/payouts" },
    { icon: ImageIcon, label: "Marketing Assets", href: "/affiliate/assets" },
    { icon: User, label: "Profile", href: "/affiliate/settings" },
  ],
};

const roleColors: Record<Role, string> = {
  patient: "bg-emerald-600",
  doctor: "bg-emerald-700",
  admin: "bg-emerald-800",
  superadmin: "bg-emerald-950",
  affiliate: "bg-[#0A2E1F]",
};

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useI18n();
  const location = useLocation();
  const doctorBase =
    role === "doctor" ? doctorPortalBaseFromPath(location.pathname) : null;
  const menu =
    role === "doctor" && doctorBase !== null ? buildDoctorMenu(doctorBase) : menuConfig[role];
  const { user, role: authRole } = useAuthStore();
  const orders = usePatientStore((s) => s.orders) ?? [];
  const notifications = usePatientStore((s) => s.notifications) ?? [];
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pendingCount = orders.filter(
    (o) => o.status === "order_submitted" || o.status === "medical_review"
  ).length;
  const unreadNotificationsCount = notifications.filter((n) => n?.unread).length;

  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Guest User";

  const displayRole = authRole?.replace('_', ' ') || role;
  const isAdminPortal = role === "admin" || role === "superadmin" || role === "doctor" || (authRole as string) === "brand_admin";

  const SidebarContent = () => (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden text-[#0A0D14] border-r",
        role === "doctor"
          ? "border-emerald-200/65 bg-gradient-to-b from-emerald-50/95 via-white to-teal-50/25"
          : "border-slate-100 bg-white",
      )}
    >
      <div
        className={cn(
          "flex h-24 items-center justify-center border-b px-6 shrink-0 relative",
          role === "doctor" ? "border-emerald-100/80 bg-emerald-950/[0.03]" : "border-slate-100 bg-white",
        )}
      >
        {onMobileClose && (
          <button onClick={onMobileClose} className="absolute right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        {menu.map((item, index) => {
          const prevItem = index > 0 ? menu[index - 1] : null;
          const showGroup = item.group && item.group !== "BOTTOM" && (!prevItem || prevItem.group !== item.group);
          const isBottom = item.group === "BOTTOM" && (!prevItem || prevItem.group !== "BOTTOM");

          return (
            <div key={item.href} className="w-full">
              {showGroup && (
                <div className="px-4 pb-2 pt-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  {item.group}
                </div>
              )}
              {isBottom && <div className="h-px my-4 mx-3 bg-slate-50" />}
              
              <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} className="mb-1">
                <NavLink
                  to={item.href}
                  end={navLinkEndsAtExact(role, doctorBase, item.href)}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3.5 text-[13px] font-black transition-all duration-300 group relative overflow-hidden",
                      isActive
                        ? "bg-[#0A2E1F] text-white shadow-[0_10px_28px_-6px_rgba(10,46,31,0.45)] border-l-4 border-[#D4AF37]"
                        : role === "doctor"
                          ? "text-slate-600 hover:text-[#0A2E1F] hover:bg-white/85 hover:border-l-emerald-300/90 border-l-4 border-transparent hover:shadow-sm"
                          : "text-slate-500 hover:text-[#0A2E1F] hover:bg-slate-50/80 border-l-4 border-transparent",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 min-w-0 relative z-10">
                        <item.icon className={cn(
                          "h-5 w-5 shrink-0 transition-all duration-300", 
                          isActive ? "text-[#D4AF37] scale-110" : "text-slate-400 group-hover:text-[#0A2E1F] group-hover:scale-110"
                        )} />
                        <span className="truncate uppercase tracking-tight">{item.label}</span>
                      </div>
                      {(() => {
                        let badgeCount = item.badge;
                        if (item.label === "Patient Queue") badgeCount = pendingCount;
                        if (item.label === "Notifications") badgeCount = unreadNotificationsCount;
                        if (badgeCount && badgeCount > 0) {
                          return (
                            <span className={cn("h-5 min-w-5 px-1.5 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 shadow-sm relative z-10",
                              isActive ? "bg-[#D4AF37] text-[#0A2E1F]" : "bg-emerald-100 text-[#0A2E1F]"
                            )}>
                              {badgeCount}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </NavLink>
              </motion.div>
            </div>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      <div className="hidden md:flex h-full w-60 shrink-0 flex-col">
        <SidebarContent />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onMobileClose} />
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="relative w-72 bg-white h-full shadow-2xl z-10"
          >
            <SidebarContent />
          </motion.div>
        </div>
      )}
      <div className="md:hidden contents">
        {!mobileOpen && <SidebarContent />}
      </div>
    </>
  );
}
