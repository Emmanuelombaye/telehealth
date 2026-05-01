import { NavLink, Link } from "react-router";
import {
  LayoutDashboard, Users, Calendar, MessageSquare, ClipboardList,
  FileText, Settings, LogOut, Stethoscope, Activity, ShieldCheck,
  CreditCard, FlaskConical, X, TrendingUp, Package, Wrench,
  HelpCircle, Tag, Share2, BarChart3, Layers, Home,
  Bell, User, Heart, FolderOpen, Pill, TestTube, UserCheck,
  FileCheck, Receipt, Percent, Building2
} from "lucide-react";
import { cn } from "./ui/shared";
import { useI18n } from "../../lib";

type Role = "patient" | "doctor" | "admin" | "finance" | "lab";

interface SidebarProps {
  role: Role;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuConfig: Record<Role, { icon: any; label: string; href: string; badge?: number }[]> = {
  patient: [
    { icon: Home, label: "Overview", href: "/patient" },
    { icon: Calendar, label: "Appointments", href: "/patient/appointments", badge: 1 },
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
    { icon: Calendar, label: "Schedule", href: "/doctor/schedule" },
    { icon: MessageSquare, label: "Messages", href: "/doctor/messages", badge: 2 },
    { icon: Stethoscope, label: "Consultation", href: "/doctor/consult" },
    { icon: FlaskConical, label: "Lab Requests", href: "/doctor/labs" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Home", href: "/admin" },
    { icon: Heart, label: "Treatments", href: "/admin/treatments" },
    { icon: Package, label: "Orders", href: "/admin/orders", badge: 5 },
    { icon: MessageSquare, label: "Messages", href: "/admin/messages", badge: 8 },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Wrench, label: "Tools & Services", href: "/admin/tools" },
    { icon: HelpCircle, label: "Questionnaire", href: "/admin/questionnaire" },
    { icon: Layers, label: "Products", href: "/admin/products" },
    { icon: Settings, label: "Builders", href: "/admin/builders" },
    { icon: CreditCard, label: "Finances", href: "/admin/finance" },
    { icon: Tag, label: "Discounts", href: "/admin/discounts" },
    { icon: Share2, label: "Affiliates", href: "/admin/affiliates" },
    { icon: Users, label: "User Management", href: "/admin/users" },
    { icon: ShieldCheck, label: "Audit Logs", href: "/admin/audit" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ],
  finance: [
    { icon: CreditCard, label: "Payments", href: "/finance" },
    { icon: TrendingUp, label: "Revenue", href: "/finance/revenue" },
    { icon: Receipt, label: "Invoices", href: "/finance/invoices" },
    { icon: Percent, label: "Discounts", href: "/finance/discounts" },
  ],
  lab: [
    { icon: FlaskConical, label: "Test Orders", href: "/lab" },
    { icon: Package, label: "Pharmacy", href: "/lab/pharmacy" },
  ],
};

const roleColors: Record<Role, string> = {
  patient: "bg-blue-500",
  doctor: "bg-emerald-500",
  admin: "bg-slate-700",
  finance: "bg-amber-500",
  lab: "bg-purple-500",
};

const roleLabels: Record<Role, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Portal",
  admin: "Admin Portal",
  finance: "Finance Portal",
  lab: "Lab Portal",
};

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useI18n();
  const menu = menuConfig[role];

  const Content = () => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex h-14 md:h-16 items-center justify-between border-b border-sidebar-border px-4 shrink-0">
        <Link to="/" className="flex items-center gap-2.5" onClick={onMobileClose}>
          <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", roleColors[role])}>
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Brandan Health</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{roleLabels[role]}</p>
          </div>
        </Link>
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-accent">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menu.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === `/${role}`}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className={cn("h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
                    isActive ? "bg-white/20 text-white" : "bg-red-500 text-white")}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border shrink-0 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent">
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", roleColors[role])}>
            {role === "doctor" ? "DB" : role === "admin" ? "AD" : role === "patient" ? "JD" : "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">
              {role === "doctor" ? "Dr. Brandan" : role === "admin" ? "Admin User" : role === "patient" ? "John Doe" : "Staff"}
            </p>
            <p className="text-[10px] text-muted-foreground capitalize">{role} · Online</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        </div>
        <Link to="/" onClick={onMobileClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-4 w-4" />
          <span>{t("logout")}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <Content />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative w-72 bg-sidebar text-sidebar-foreground h-full shadow-2xl z-10">
            <Content />
          </div>
        </div>
      )}
    </>
  );
}
