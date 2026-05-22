import { Link } from "react-router";
import {
  Search,
  Bell,
  Sun,
  Moon,
  RefreshCw,
  Bot,
  Building2,
  Radio,
  ChevronDown,
  Maximize2,
} from "lucide-react";
import { Button, Input, cn } from "../../ui/shared.tsx";
import { useAuthStore } from "../../../../lib/auth-store";
import { usePatientStore } from "../../../../lib/patient-store";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { useRpmData } from "../../../pages/doctor/rpm/useRpmData";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";

export function RpmTopBar() {
  const doctorBase = useDoctorPortalBase();
  const { user } = useAuthStore();
  const notifications = usePatientStore((s) => s.notifications) ?? [];
  const criticalCount = useRpmData().stats.criticalAlerts;
  const unread = notifications.filter((n) => n?.unread).length;
  const {
    search,
    setSearch,
    theme,
    setTheme,
    fetchAll,
    refreshing,
    livePulse,
    wallMode,
    setWallMode,
  } = useRpmData();

  const name = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user?.email?.split("@")[0] ?? "Physician";

  return (
    <header className={cn(rpmGlass, "sticky top-0 z-30 mx-2 sm:mx-4 mt-2 sm:mt-4 mb-2 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-2 sm:gap-3")}>
      <div className="flex items-center gap-2 min-w-0 sm:min-w-[140px]">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/20">
          <Radio className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest rpm-muted hidden sm:block">RPM Command</p>
          <p className="text-sm font-black rpm-text truncate max-w-[120px] sm:max-w-none">Peak Health</p>
        </div>
      </div>

      <div className="relative w-full order-3 sm:order-none sm:flex-1 min-w-0 sm:min-w-[200px] max-w-full sm:max-w-md basis-full sm:basis-auto">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rpm-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patients, alerts, devices…"
          className="pl-9 rounded-xl border-0 bg-black/5 rpm-dark:bg-white/10 h-10 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <span
          className={cn(
            "hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
            livePulse ? "bg-emerald-500/20 text-emerald-600" : "rpm-muted bg-black/5 rpm-dark:bg-white/10",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full bg-emerald-500", livePulse && "animate-ping")} />
          Live sync
        </span>

        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => setWallMode(!wallMode)} title="Wall view">
          <Maximize2 className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={fetchAll} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Link
          to={`${doctorBase}/scribe`}
          className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white px-3 py-2 text-xs font-bold shadow-lg shadow-violet-900/25 hover:opacity-95"
        >
          <Bot className="h-3.5 w-3.5" />
          AI Assistant
        </Link>

        <button
          type="button"
          className="hidden lg:inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold rpm-border"
        >
          <Building2 className="h-3.5 w-3.5" />
          Organization
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>

        <Link
          to={`${doctorBase}/notifications`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl rpm-border hover:bg-black/5 rpm-dark:hover:bg-white/10"
        >
          <Bell className="h-4 w-4" />
          {(criticalCount > 0 || unread > 0) && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center">
              {criticalCount || unread}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 rounded-xl border rpm-border pl-1 pr-2 py-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0A2E1F] to-emerald-700 text-white text-xs font-black flex items-center justify-center">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-bold max-w-[100px] truncate hidden sm:inline rpm-text">{name}</span>
          <ChevronDown className="h-3 w-3 rpm-muted hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
