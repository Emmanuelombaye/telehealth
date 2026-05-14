import { useState, useMemo } from "react";
import { NavLink, Link, useLocation } from "react-router";
import {
  LayoutDashboard, Users, Calendar, MessageSquare, ClipboardList,
  FileText, Settings, LogOut, Stethoscope, Activity, ShieldCheck,
  CreditCard, FlaskConical, X, TrendingUp, Package, Wrench,
  HelpCircle, Tag, Share2, BarChart3, Layers, Home,
  Bell, User, Heart, FolderOpen, Pill, TestTube, UserCheck,
  FileCheck, Receipt, BookOpen, Building2, Truck,
  Image as ImageIcon, ArrowRightLeft, Bot, HeartPulse, ScrollText
} from "lucide-react";
import { cn } from "./ui/shared.tsx";
import { useI18n } from "../../lib/i18n.tsx";
import { brand } from "../../lib/patient-store";
import { useAuthStore } from "../../lib/auth-store";
import { usePatientStore } from "../../lib/patient-store";
import { doctorPortalBaseFromPath } from "../../lib/doctorPortalBase";
import { LogoutConfirmation } from "./LogoutConfirmation";
import { motion, AnimatePresence } from "framer-motion";

type Role = "patient" | "doctor" | "admin" | "superadmin" | "affiliate";

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
  doctor: [
    { group: "CLINICAL CORE", icon: LayoutDashboard, label: "Overview", href: "/doctor" },
    { group: "CLINICAL CORE", icon: ClipboardList, label: "Clinical queue", href: "/doctor/queue" },
    { group: "CLINICAL CORE", icon: Stethoscope, label: "Case workspace", href: "/doctor/consult" },
    { group: "CLINICAL CORE", icon: Users, label: "Patients", href: "/doctor/patients" },
    { group: "CARE COORDINATION", icon: Calendar, label: "Schedule", href: "/doctor/schedule" },
    { group: "CARE COORDINATION", icon: Activity, label: "Availability", href: "/doctor/availability" },
    { group: "CARE COORDINATION", icon: MessageSquare, label: "Messages", href: "/doctor/messages" },
    { group: "CARE COORDINATION", icon: Bell, label: "Notifications", href: "/doctor/notifications" },
    { group: "DIAGNOSTICS & RX", icon: FlaskConical, label: "Labs", href: "/doctor/labs" },
    { group: "DIAGNOSTICS & RX", icon: ImageIcon, label: "Imaging", href: "/doctor/imaging" },
    { group: "DIAGNOSTICS & RX", icon: Bot, label: "AI Scribe", href: "/doctor/scribe" },
    { group: "DIAGNOSTICS & RX", icon: Pill, label: "e-Prescribing", href: "/doctor/erx" },
    { group: "PROGRAMS", icon: HeartPulse, label: "RPM", href: "/doctor/rpm" },
    { group: "PROGRAMS", icon: ArrowRightLeft, label: "Referrals", href: "/doctor/referrals" },
    { group: "PROGRAMS", icon: CreditCard, label: "Billing", href: "/doctor/billing" },
    { group: "PROGRAMS", icon: BookOpen, label: "Education", href: "/doctor/education" },
  ],
  admin: [
    { group: "MANAGEMENT", icon: Home, label: "Home", href: "/admin" },
    { group: "MANAGEMENT", icon: Users, label: "Patients", href: "/admin/patients" },
    { group: "MANAGEMENT", icon: HeartPulse, label: "Treatments", href: "/admin/treatments" },
    { group: "MANAGEMENT", icon: Package, label: "Orders", href: "/admin/orders" },
    { group: "MANAGEMENT", icon: MessageSquare, label: "Messenger", href: "/admin/messages" },
    { group: "MANAGEMENT", icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { group: "MANAGEMENT", icon: ScrollText, label: "Audit Logs", href: "/admin/audit" },
    { group: "TOOLS & SERVICES", icon: FileText, label: "Questionnaires", href: "/admin/questionnaires" },
    { group: "TOOLS & SERVICES", icon: Layers, label: "Products", href: "/admin/products" },
    { group: "TOOLS & SERVICES", icon: Wrench, label: "Builders", href: "/admin/builders" },
    { group: "SALES & CHANNELS", icon: CreditCard, label: "Finances", href: "/admin/finance" },
    { group: "SALES & CHANNELS", icon: Tag, label: "Discounts", href: "/admin/discounts" },
    { group: "SALES & CHANNELS", icon: Share2, label: "Affiliates", href: "/admin/affiliates" },
    { group: "BOTTOM", icon: Settings, label: "Settings", href: "/admin/settings" },
  ],
  superadmin: [
    { icon: LayoutDashboard, label: "Overview", href: "/superadmin" },
    { icon: Building2, label: "Brands", href: "/superadmin/brands" },
    { icon: Package, label: "Platform Orders", href: "/superadmin/orders" },
    { icon: Layers, label: "Global Inventory", href: "/superadmin/products" },
    { icon: Stethoscope, label: "Doctors", href: "/superadmin/doctors" },
    { icon: Users, label: "All Users", href: "/superadmin/users" },
    { icon: BarChart3, label: "Analytics", href: "/superadmin/analytics" },
    { icon: CreditCard, label: "Finance", href: "/superadmin/finance" },
    { icon: ScrollText, label: "Audit Logs", href: "/superadmin/audit" },
    { icon: ShieldCheck, label: "Security", href: "/superadmin/security" },
    { icon: Settings, label: "Platform Settings", href: "/superadmin/settings" },
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
  const { pathname } = useLocation();
  const doctorBase = doctorPortalBaseFromPath(pathname);
  const menu = useMemo(() => {
    const raw = menuConfig[role];
    if (role !== "doctor") return raw;
    return raw.map((item) => ({
      ...item,
      href: item.href.replace(/^\/doctor/, doctorBase),
    }));
  }, [role, doctorBase]);
  const { user, role: authRole } = useAuthStore();
  const { orders, notifications } = usePatientStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pendingCount = orders.filter(o => o.status === "order_submitted" || o.status === "medical_review").length;
  const videoInboxCount = orders.filter(o => o.zoom_status === "requested").length;
  const unreadNotificationsCount = notifications.filter(n => n.unread).length;

  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Guest User";

  const displayRole = authRole?.replace('_', ' ') || role;
  const isAdminPortal = role === "admin" || role === "superadmin" || role === "doctor" || (authRole as string) === "brand_admin";

  const MotionNavLink = motion(NavLink);

  const superNav = role === "superadmin";

  const SidebarContent = () => (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden border-r bg-white",
        superNav ? "border-slate-200/80 text-slate-800" : "border-slate-100 text-[#0A0D14]",
      )}
    >
      <div className="flex h-24 items-center justify-center border-b border-slate-100 px-6 shrink-0 bg-white relative">
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
              
              <MotionNavLink
                to={item.href}
                end={
                  role === "doctor"
                    ? item.href === doctorBase
                    : item.href === `/${role}`
                }
                onClick={onMobileClose}
                whileHover={{ x: superNav ? 2 : 4 }}
                whileTap={{ scale: 0.98 }}
                className={({ isActive }) =>
                  cn(
                    "group relative mb-1 flex items-center justify-between overflow-hidden rounded-xl px-3 py-2.5 text-[13px] transition-colors duration-200",
                    superNav
                      ? isActive
                        ? "bg-slate-900 font-medium text-white shadow-sm"
                        : "border border-transparent font-medium text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      : cn(
                          "font-black duration-300",
                          isActive
                            ? "border-l-4 border-[#D4AF37] bg-[#0A2E1F] text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                            : "border-l-4 border-transparent text-slate-500 hover:bg-slate-50/80 hover:text-[#0A2E1F]",
                        ),
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative z-10 flex min-w-0 items-center gap-3">
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-all duration-300",
                          superNav
                            ? isActive
                              ? "text-emerald-400"
                              : "text-slate-400 group-hover:text-slate-700"
                            : isActive
                              ? "scale-110 text-[#D4AF37]"
                              : "text-slate-400 group-hover:scale-110 group-hover:text-[#0A2E1F]",
                        )}
                      />
                      <span className={cn("truncate tracking-tight", superNav ? "" : "uppercase")}>{item.label}</span>
                    </div>
                    {(() => {
                      let badgeCount = item.badge;
                      if (item.label === "Clinical queue") badgeCount = pendingCount;
                      if (item.label === "Case workspace") badgeCount = videoInboxCount;
                      if (item.label === "Notifications") badgeCount = unreadNotificationsCount;
                      if (badgeCount && badgeCount > 0) {
                        return (
                          <span
                            className={cn(
                              "relative z-10 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-semibold shadow-sm",
                              superNav
                                ? isActive
                                  ? "bg-emerald-400 text-slate-900"
                                  : "bg-emerald-100 text-emerald-900"
                                : isActive
                                  ? "bg-[#D4AF37] font-black text-[#0A2E1F]"
                                  : "bg-emerald-100 font-black text-[#0A2E1F]",
                            )}
                          >
                            {badgeCount}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}
              </MotionNavLink>
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
