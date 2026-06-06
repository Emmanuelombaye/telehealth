import type { LucideIcon } from "lucide-react";
import {
  Radio,
  Activity,
  Bell,
  AlertOctagon,
  Watch,
  Shield,
  TrendingUp,
  Users,
  Siren,
  FileBarChart,
  Plug,
  Settings,
  HeartPulse,
} from "lucide-react";

export type RpmNavItem = { path: string; label: string; icon: LucideIcon; desc?: string };

export function rpmNavItems(base: "/doctor" | "/providers"): RpmNavItem[] {
  const p = (s: string) => `${base}/rpm${s}`;
  return [
    { path: p(""), label: "Live Monitoring", icon: Radio, desc: "Command center" },
    { path: p("/vitals"), label: "Patient Vitals", icon: Activity },
    { path: p("/alerts"), label: "Alerts Center", icon: Bell },
    { path: p("/critical"), label: "Critical Cases", icon: AlertOctagon },
    { path: p("/devices"), label: "Device Management", icon: Watch },
    { path: p("/compliance"), label: "Compliance Tracking", icon: Shield },
    { path: p("/ai-risk"), label: "Clinical Risk", icon: HeartPulse, desc: "Vitals-based scoring" },
    { path: p("/analytics"), label: "Trends & Analytics", icon: TrendingUp },
    { path: p("/queue"), label: "Care Team Queue", icon: Users },
    { path: p("/escalations"), label: "Emergency Escalations", icon: Siren },
    { path: p("/reports"), label: "RPM Reports", icon: FileBarChart },
    { path: p("/integrations"), label: "Integrations", icon: Plug },
    { path: p("/settings"), label: "Settings", icon: Settings },
  ];
}

export function doctorRpmSidebarChildren(base: "/doctor" | "/providers") {
  return rpmNavItems(base).map(({ path, label, icon }) => ({ href: path, label, icon }));
}
