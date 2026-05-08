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
import { useI18n, brand } from "../../lib";

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

  const SidebarContent = () => (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 shrink-0 bg-sidebar">
        <Link to="/" className="flex items-center justify-center w-full py-4 px-2 group transition-all" onClick={onMobileClose}>
          <img src="/originallogo.png" alt="Peak Health Logo" className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
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
                <div className="px-3 pb-2 pt-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  {item.group}
                </div>
              )}
              {isBottom && (
                <div className="h-px bg-sidebar-border/60 my-3 mx-2" />
              )}
              <NavLink
                to={item.href}
                end={item.href === `/${role}`}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-200 group relative mb-0.5",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className={cn("h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm",
                        isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
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
      <div className="p-4 border-t border-sidebar-border shrink-0 space-y-2 bg-sidebar/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-inner", roleColors[role])}>
            {role === "doctor" ? "HV" : role === "admin" ? "AV" : role === "patient" ? "AS" : "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">
              {role === "doctor" ? "Dr. Harrison Vance" : role === "admin" ? "Alex Sterling" : role === "patient" ? "Alex Sterling" : "Staff Member"}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize font-medium">{role} Portal · Online</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        </div>
        <Link to="/" onClick={onMobileClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors group">
          <LogOut className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t("logout")}</span>
        </Link>
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
