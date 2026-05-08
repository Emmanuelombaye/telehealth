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
import { useI18n, brand, useAuthStore } from "../../lib";

type Role = "patient" | "doctor" | "admin" | "superadmin" | "pharmacy";

interface SidebarProps {
  role: Role;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuConfig: Record<Role, { icon: any; label: string; href: string; badge?: number; group?: string }[]> = {
  patient: [
    { icon: Home, label: "Overview", href: "/patient" },
    { icon: Package, label: "Shop Treatments", href: "/patient/shop" },
    { icon: TrendingUp, label: "My Orders", href: "/patient/orders", badge: 1 },
    { icon: Calendar, label: "Appointments", href: "/patient/appointments" },
    { icon: FileCheck, label: "Intake Forms", href: "/patient/intake" },
    { icon: ClipboardList, label: "Visit Forms", href: "/patient/visit-forms" },
    { icon: MessageSquare, label: "Messages", href: "/patient/messages", badge: 3 },
    { icon: FileText, label: "Visit Summaries", href: "/patient/summaries" },
    { icon: Pill, label: "Prescriptions", href: "/patient/prescriptions" },
    { icon: TestTube, label: "Lab Results", href: "/patient/labs" },
    { icon: FolderOpen, label: "Documents", href: "/patient/documents" },
    { icon: User, label: "Profile", href: "/patient/profile" },
    { icon: ShieldCheck, label: "Identity", href: "/patient/identity" },
    { icon: Users, label: "Family Access", href: "/patient/family" },
    { icon: Bell, label: "Notifications", href: "/patient/notifications", badge: 2 },
    { icon: Building2, label: "Insurance", href: "/patient/insurance" },
  ],
  doctor: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/doctor" },
    { icon: Users, label: "Patients", href: "/doctor/patients" },
    { icon: ClipboardList, label: "Patient Queue", href: "/doctor/queue", badge: 3 },
    { icon: Calendar, label: "Schedule", href: "/doctor/schedule" },
    { icon: Activity, label: "Availability", href: "/doctor/availability" },
    { icon: MessageSquare, label: "Messages", href: "/doctor/messages", badge: 2 },
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
    { group: "MANAGEMENT", icon: MessageSquare, label: "Messenger", href: "/admin/messages", badge: 3 },
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
    { icon: Home, label: "Brand Admin", href: "/admin" },
    { icon: Users, label: "Doctor Queue", href: "/doctor/queue" },
    { icon: Building2, label: "Brands", href: "/superadmin/brands" },
    { icon: BarChart3, label: "Analytics", href: "/superadmin/analytics" },
    { icon: Users, label: "All Users", href: "/superadmin/users" },
    { icon: CreditCard, label: "Finance", href: "/superadmin/finance" },
    { icon: ShieldCheck, label: "Security", href: "/superadmin/security" },
    { icon: Settings, label: "Platform Settings", href: "/superadmin/settings" },
  ],
  pharmacy: [
    { icon: LayoutDashboard, label: "Dispensary Overview", href: "/pharmacy" },
    { icon: ClipboardList, label: "Incoming Rx", href: "/pharmacy/orders", badge: 12 },
    { icon: Truck, label: "Ready for Pickup", href: "/pharmacy/pickup" },
    { icon: Package, label: "Shipping Queue", href: "/pharmacy/shipping", badge: 5 },
    { icon: FlaskConical, label: "Compounding Log", href: "/pharmacy/compounding" },
    { icon: Layers, label: "Inventory Mgmt", href: "/pharmacy/inventory" },
    { icon: FileText, label: "Audit Reports", href: "/pharmacy/audit" },
    { icon: Settings, label: "Pharmacy Settings", href: "/pharmacy/settings" },
  ],
};

const roleColors: Record<Role, string> = {
  patient: "bg-lavender-500",
  doctor: "bg-sage-500",
  admin: "bg-peach-700",
  superadmin: "bg-lavender-700",
  pharmacy: "bg-emerald-600",
};

const roleLabels: Record<Role, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Portal",
  admin: "System Administration",
  superadmin: "Super Admin",
  pharmacy: "Pharmacy Portal",
};

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useI18n();
  const menu = menuConfig[role];
  const { user, role: authRole } = useAuthStore();

  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Guest User";

  const displayRole = authRole?.replace('_', ' ') || role;

  const isAdminPortal = role === "admin" || role === "superadmin";

  const SidebarContent = () => (
    <div className={cn(
      "flex h-full flex-col overflow-hidden text-sidebar-foreground border-r",
      isAdminPortal ? "bg-[#0c120f] border-[#1a2620]" : "bg-sidebar border-sidebar-border"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex h-32 items-center justify-between border-b px-4 shrink-0",
        isAdminPortal ? "bg-[#0c120f] border-[#1a2620]" : "bg-sidebar border-sidebar-border"
      )}>
        <Link to="/" className="flex items-center justify-center w-full py-4 px-2 group transition-all" onClick={onMobileClose}>
          <img src="/originallogo.png" alt="Peak Health Logo" className={cn(
            "h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105",
            isAdminPortal ? "brightness-110" : ""
          )} />
        </Link>
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
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
                  isAdminPortal ? "text-[#4f6458]" : "text-muted-foreground"
                )}>
                  {item.group}
                </div>
              )}
              {isBottom && (
                <div className={cn("h-px my-3 mx-2", isAdminPortal ? "bg-[#1a2620]" : "bg-sidebar-border/60")} />
              )}
              <NavLink
                to={item.href}
                end={item.href === `/${role}`}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 group relative mb-0.5",
                    isActive
                      ? isAdminPortal ? "bg-[#22c55e]/10 text-[#22c55e] font-bold" : "bg-primary/10 text-primary font-semibold"
                      : isAdminPortal ? "text-[#7f9488] hover:bg-[#1a2620] hover:text-[#e2e8f0]" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-colors", 
                        isActive 
                          ? isAdminPortal ? "text-[#22c55e]" : "text-primary" 
                          : isAdminPortal ? "text-[#4f6458] group-hover:text-[#22c55e]" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className={cn("h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm",
                        isActive 
                          ? isAdminPortal ? "bg-[#22c55e] text-black" : "bg-primary text-primary-foreground" 
                          : isAdminPortal ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-primary/10 text-primary"
                      )}>
                        {item.badge}
                      </span>
                    )}
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
        isAdminPortal ? "bg-[#0c120f]/50 border-[#1a2620]" : "bg-sidebar/50 border-sidebar-border"
      )}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-2xl border",
          isAdminPortal ? "bg-[#1a2620] border-[#22c55e]/10" : "bg-sidebar-accent/50 border-sidebar-border"
        )}>
          <div className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-inner", 
            isAdminPortal ? "bg-[#d4c4a8] text-black" : roleColors[role],
            isAdminPortal ? "" : "text-white"
          )}>
            {fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-bold truncate", isAdminPortal ? "text-[#e2e8f0]" : "")}>
              {fullName}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize font-medium">{displayRole} · Online</p>
          </div>
          <div className={cn("h-2 w-2 rounded-full animate-pulse shrink-0", isAdminPortal ? "bg-[#22c55e]" : "bg-emerald-500")} />
        </div>
        <button 
          onClick={() => {
            if (window.confirm("Are you sure you want to sign out?")) {
              useAuthStore.getState().signOut();
              window.location.href = "/";
            }
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors group text-left"
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
