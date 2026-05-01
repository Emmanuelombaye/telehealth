import { NavLink, Link } from "react-router";
import {
  LayoutDashboard, Users, Calendar, MessageSquare, ClipboardList,
  FileText, Settings, LogOut, Stethoscope, Activity, ShieldCheck,
  CreditCard, FlaskConical, X, TrendingUp, Package, Wrench,
  HelpCircle, Tag, Share2, BarChart3, Layers, Home,
  Bell, User, Heart, FolderOpen, Pill, TestTube, UserCheck,
  FileCheck, Receipt, Percent, Building2, Bot, HeartPulse,
  Image as ImageIcon, ArrowRightLeft, BookOpen
} from "lucide-react";
import { cn } from "./ui/shared";
import { useI18n } from "../../lib";

type Role = "patient" | "doctor" | "admin" | "finance" | "lab" | "pharmacy" | "insurance" | "nurse" | "corporate" | "affiliate";

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
    { icon: Bot, label: "AI Scribe", href: "/doctor/scribe" },
    { icon: HeartPulse, label: "RPM", href: "/doctor/rpm", badge: 4 },
    { icon: Pill, label: "e-Prescribing", href: "/doctor/erx" },
    { icon: ImageIcon, label: "Imaging (PACS)", href: "/doctor/imaging" },
    { icon: ArrowRightLeft, label: "Referrals", href: "/doctor/referrals" },
    { icon: Receipt, label: "Coding & Billing", href: "/doctor/billing" },
    { icon: BookOpen, label: "Education", href: "/doctor/education" },
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
  pharmacy: [
    { icon: Pill, label: "Prescriptions", href: "/pharmacy" },
    { icon: Package, label: "Inventory", href: "/pharmacy/inventory" },
    { icon: TrendingUp, label: "Fulfillment", href: "/pharmacy/fulfillment" },
  ],
  insurance: [
    { icon: Building2, label: "Claims", href: "/insurance" },
    { icon: Receipt, label: "Authorizations", href: "/insurance/authorizations" },
    { icon: Users, label: "Members", href: "/insurance/members" },
  ],
  nurse: [
    { icon: Stethoscope, label: "Triage Queue", href: "/nurse" },
    { icon: FileCheck, label: "Intake Review", href: "/nurse/intake" },
    { icon: Heart, label: "Vitals", href: "/nurse/vitals" },
  ],
  corporate: [
    { icon: Building2, label: "Dashboard", href: "/corporate" },
    { icon: Users, label: "Employees", href: "/corporate/employees" },
    { icon: BarChart3, label: "Usage Analytics", href: "/corporate/analytics" },
    { icon: Receipt, label: "Billing", href: "/corporate/billing" },
  ],
  affiliate: [
    { icon: Share2, label: "Referrals", href: "/affiliate" },
    { icon: TrendingUp, label: "Commissions", href: "/affiliate/commissions" },
    { icon: FileText, label: "Marketing Assets", href: "/affiliate/assets" },
  ],
};

const roleColors: Record<Role, string> = {
  patient: "bg-blue-500",
  doctor: "bg-emerald-500",
  admin: "bg-slate-700",
  finance: "bg-amber-500",
  lab: "bg-purple-500",
  pharmacy: "bg-teal-500",
  insurance: "bg-blue-600",
  nurse: "bg-pink-500",
  corporate: "bg-indigo-600",
  affiliate: "bg-orange-500",
};

const roleLabels: Record<Role, string> = {
  patient: "Patient Portal",
  doctor: "Doctor Portal",
  admin: "System Administration",
  finance: "Finance Portal",
  lab: "Lab Portal",
  pharmacy: "Pharmacy Portal",
  insurance: "Insurance Portal",
  nurse: "Nurse Triage Portal",
  corporate: "Corporate Portal",
  affiliate: "Affiliate Portal",
};

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useI18n();
  const menu = menuConfig[role];

  const SidebarContent = () => (
    <div className="flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4 shrink-0 bg-sidebar">
        <Link to="/" className="flex items-center gap-2.5" onClick={onMobileClose}>
          <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg", roleColors[role])}>
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Brandon Health</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{roleLabels[role]}</p>
          </div>
        </Link>
        {onMobileClose && (
          <button onClick={onMobileClose} className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menu.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === `/${role}`}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className={cn("h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm",
                    isActive ? "bg-white/20 text-white" : "bg-primary text-primary-foreground")}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
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
