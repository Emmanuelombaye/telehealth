import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  ClipboardList, 
  FileText, 
  Settings, 
  LogOut,
  Stethoscope,
  Activity,
  ShieldCheck,
  CreditCard,
  FlaskConical,
  Store
} from "lucide-react";
import { cn } from "./ui/shared";

interface SidebarProps {
  role: "doctor" | "admin" | "finance" | "lab";
}

export function Sidebar({ role }: SidebarProps) {
  const menuItems = {
    doctor: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/doctor" },
      { icon: Users, label: "Patients", href: "/doctor/patients" },
      { icon: Calendar, label: "Schedule", href: "/doctor/schedule" },
      { icon: MessageSquare, label: "Messages", href: "/doctor/messages" },
      { icon: Stethoscope, label: "Consultation", href: "/doctor/consult" },
      { icon: ClipboardList, label: "Lab Requests", href: "/doctor/labs" },
    ],
    admin: [
      { icon: LayoutDashboard, label: "Overview", href: "/admin" },
      { icon: Users, label: "User Management", href: "/admin/users" },
      { icon: ShieldCheck, label: "Audit Logs", href: "/admin/audit" },
      { icon: Settings, label: "System Config", href: "/admin/settings" },
    ],
    finance: [
      { icon: CreditCard, label: "Payments", href: "/finance" },
      { icon: Activity, label: "Revenue", href: "/finance/revenue" },
      { icon: FileText, label: "Invoices", href: "/finance/invoices" },
    ],
    lab: [
      { icon: FlaskConical, label: "Test Orders", href: "/lab" },
      { icon: Store, label: "Pharmacy", href: "/lab/pharmacy" },
    ],
  };

  const currentMenu = menuItems[role];

  return (
    <div className="hidden md:flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Activity className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-lg tracking-tight">Brandan Health</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {currentMenu.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <button className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
