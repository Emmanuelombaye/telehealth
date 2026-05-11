import { useState } from "react";
import { NavLink, Link } from "react-router";
import {
  LayoutDashboard, Users, Calendar, MessageSquare, ClipboardList,
  FileText, Settings, LogOut, Stethoscope, Activity, ShieldCheck,
  CreditCard, FlaskConical, X, TrendingUp, Package, Wrench,
  HelpCircle, Tag, Share2, BarChart3, Layers, Home,
  Bell, User, Heart, FolderOpen, Pill, TestTube, UserCheck,
  FileCheck, Receipt, BookOpen, Building2, Truck,
  Image as ImageIcon, ArrowRightLeft, Bot, HeartPulse
} from "lucide-react";
import { cn } from "./ui/shared.tsx";
import { useI18n } from "../../lib/i18n.tsx";
import { brand } from "../../lib/patient-store";
import { useAuthStore } from "../../lib/auth-store";
import { usePatientStore } from "../../lib/patient-store";
import { LogoutConfirmation } from "./LogoutConfirmation";

type Role = "patient" | "doctor" | "admin" | "superadmin";

interface SidebarProps {
  role: Role;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuConfig: Record<Role, { icon: any; label: string; href: string; badge?: number; group?: string }[]> = {
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
    { icon: LayoutDashboard, label: "Dashboard", href: "/doctor" },
    { icon: Users, label: "Patients", href: "/doctor/patients" },
    { icon: ClipboardList, label: "Patient Queue", href: "/doctor/queue" },
    { icon: Calendar, label: "Schedule", href: "/doctor/schedule" },
    { icon: Activity, label: "Availability", href: "/doctor/availability" },
    { icon: MessageSquare, label: "Messages", href: "/doctor/messages" },
    { icon: Stethoscope, label: "Consultation", href: "/doctor/consult" },
    { icon: FlaskConical, label: "Lab Requests", href: "/doctor/labs" },
    { icon: Bot, label: "AI Scribe", href: "/doctor/scribe" },
    { icon: Pill, label: "e-Prescribing", href: "/doctor/erx" },
    { icon: BookOpen, label: "Education", href: "/doctor/education" },
  ],
  admin: [
    { group: "MANAGEMENT", icon: Home, label: "Home", href: "/admin" },
    { group: "MANAGEMENT", icon: Users, label: "Patients", href: "/admin/patients" },
    { group: "MANAGEMENT", icon: HeartPulse, label: "Treatments", href: "/admin/treatments" },
    { group: "MANAGEMENT", icon: Package, label: "Orders", href: "/admin/orders" },
    { group: "MANAGEMENT", icon: MessageSquare, label: "Messenger", href: "/admin/messages" },
    { group: "MANAGEMENT", icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
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
    { icon: ShieldCheck, label: "Security", href: "/superadmin/security" },
    { icon: Settings, label: "Platform Settings", href: "/superadmin/settings" },
  ],

};

const roleColors: Record<Role, string> = {
  patient: "bg-emerald-600",
  doctor: "bg-emerald-700",
  admin: "bg-emerald-800",
  superadmin: "bg-emerald-950",
};

const roleLabels: Record<Role, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Portal",
  admin: "System Administration",
  superadmin: "Super Admin",

};

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useI18n();
  const menu = menuConfig[role];
  const { user, role: authRole } = useAuthStore();

  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Guest User";

  const displayRole = authRole?.replace('_', ' ') || role;

  const isAdminPortal = role === "admin" || role === "superadmin" || role === "doctor" || (authRole as string) === "brand_admin";
  const { orders } = usePatientStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Real-time badge calculations
  const pendingCount = orders.filter(o => o.status === "order_submitted" || o.status === "medical_review").length;

  const SidebarContent = () => (
    <div className={cn(
      "flex h-full flex-col overflow-hidden text-[#0A0D14] border-r border-slate-100 bg-white"
    )}>
      <div className="flex h-24 items-center justify-between border-b border-slate-100 px-6 shrink-0 bg-white">
        <Link to="/" className="flex items-center justify-center w-full py-4 group transition-all" onClick={onMobileClose}>
          <img src="/PeakHealthLogo.png" alt="Peak Health Logo" className="h-20 w-auto object-contain transition-transform duration-500 group-hover:scale-110" />
        </Link>
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
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
                {isBottom && (
                  <div className="h-px my-4 mx-3 bg-slate-50" />
                )}
              <NavLink
                to={item.href}
                end={item.href === `/${role}`}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3.5 text-[13px] font-bold transition-all duration-300 group relative mb-1 animate-slide-in-right",
                    isActive
                      ? "bg-[#0A2E1F] text-white shadow-xl shadow-emerald-900/10"
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#0A2E1F]"
                  )
                }
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-all duration-300", 
                        isActive 
                          ? "text-white" 
                          : "text-slate-400 group-hover:text-[#0A2E1F] group-hover:scale-110"
                      )} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {(() => {
                      let badgeCount = item.badge;
                      if (item.label === "Patient Queue") badgeCount = pendingCount;
                      
                      if (badgeCount && badgeCount > 0) {
                        return (
                          <span className={cn("h-5 min-w-5 px-1.5 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 shadow-sm",
                            isActive 
                              ? "bg-white/20 text-white"
                              : "bg-emerald-100 text-[#0A2E1F]"
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
            </div>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100 bg-white space-y-3">
        <div className="flex items-center gap-4 px-4 py-4 rounded-3xl border border-slate-100 bg-slate-50/50 shadow-inner">
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 shadow-lg text-white", 
            roleColors[role]
          )}>
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-bold truncate", isAdminPortal ? "text-slate-900" : "")}>
              {fullName}
            </p>
            <p className="text-[10px] text-slate-500 capitalize font-medium">{displayRole} · Online</p>
          </div>
          <div className={cn("h-2 w-2 rounded-full animate-pulse shrink-0", isAdminPortal ? "bg-emerald-500" : "bg-emerald-500")} />
        </div>
        <button 
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors group text-left"
        >
          <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t("logout")}</span>
        </button>

        <LogoutConfirmation 
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={async () => {
            await useAuthStore.getState().signOut();
            window.location.href = "/";
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-full w-60 shrink-0 flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Modal Sidebar (Only when mobileOpen is true) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onMobileClose} />
          <div className="relative w-72 bg-sidebar text-sidebar-foreground h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Shared Content Export (For Sheet/Drawer use) */}
      <div className="md:hidden contents">
        {!mobileOpen && <SidebarContent />}
      </div>
    </>
  );
}
