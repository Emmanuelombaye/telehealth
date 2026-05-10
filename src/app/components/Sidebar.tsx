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
  patient: "bg-lavender-500",
  doctor: "bg-sage-500",
  admin: "bg-peach-700",
  superadmin: "bg-lavender-700",

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
  
  // Real-time badge calculations
  const pendingCount = orders.filter(o => o.status === "order_submitted" || o.status === "medical_review").length;

  const SidebarContent = () => (
    <div className={cn(
      "flex h-full flex-col overflow-hidden text-sidebar-foreground border-r",
      isAdminPortal ? "bg-white border-slate-200" : "bg-sidebar border-sidebar-border"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex h-24 items-center justify-between border-b px-4 shrink-0",
        isAdminPortal ? "bg-white border-slate-200" : "bg-sidebar border-sidebar-border"
      )}>
        <Link to="/" className="flex items-center justify-center w-full py-4 group transition-all" onClick={onMobileClose}>
          <img src="/logo-icon.png" alt="Peak Health Logo" className={cn(
            "h-24 w-auto object-contain mix-blend-multiply contrast-125 brightness-110 transition-transform duration-300 group-hover:scale-105"
          )} />
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
                <div className={cn(
                  "px-3 pb-2 pt-4 text-[11px] font-bold uppercase tracking-widest",
                  isAdminPortal ? "text-slate-400" : "text-muted-foreground"
                )}>
                  {item.group}
                </div>
              )}
              {isBottom && (
                <div className={cn("h-px my-3 mx-2", isAdminPortal ? "bg-slate-100" : "bg-sidebar-border/60")} />
              )}
              <NavLink
                to={item.href}
                end={item.href === `/${role}`}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 group relative mb-0.5 animate-slide-in-right",
                    isActive
                      ? isAdminPortal ? "bg-emerald-50 text-emerald-700 font-bold shadow-sm" : "bg-primary/10 text-primary font-semibold"
                      : isAdminPortal ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )
                }
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-colors", 
                        isActive 
                          ? isAdminPortal ? "text-emerald-600" : "text-primary" 
                          : isAdminPortal ? "text-slate-400 group-hover:text-emerald-500" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {(() => {
                      let badgeCount = item.badge;
                      if (item.label === "Patient Queue") badgeCount = pendingCount;
                      
                      if (badgeCount && badgeCount > 0) {
                        return (
                          <span className={cn("h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm",
                            isActive 
                              ? isAdminPortal ? "bg-emerald-600 text-white" : "bg-primary text-white"
                              : isAdminPortal ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
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

      {/* User footer */}
      <div className={cn(
        "p-4 border-t shrink-0 space-y-2",
        isAdminPortal ? "bg-slate-50/50 border-slate-200" : "bg-sidebar/50 border-sidebar-border"
      )}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-2xl border",
          isAdminPortal ? "bg-white border-slate-200 shadow-sm" : "bg-sidebar-accent/50 border-sidebar-border"
        )}>
          <div className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-inner", 
            isAdminPortal ? "bg-emerald-100 text-emerald-700" : roleColors[role],
            isAdminPortal ? "" : "text-white"
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
          onClick={async () => {
            await useAuthStore.getState().signOut();
            window.location.href = "/";
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors group text-left"
        >
          <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t("logout")}</span>
        </button>
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
