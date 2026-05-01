import { Outlet, useLocation, useNavigate, Link } from "react-router";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Bell, Search, ChevronLeft, Moon, Sun, Globe, Menu, Activity, X } from "lucide-react";
import { cn } from "./ui/shared";
import { useI18n, useTheme, LOCALES } from "../../lib";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();
  const { dark, toggle } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const path = location.pathname;
  const isLanding = path === "/";
  const isPatient = path.startsWith("/patient");
  const isDoctor = path.startsWith("/doctor");
  const isAdmin = path.startsWith("/admin");
  const isFinance = path.startsWith("/finance");
  const isLab = path.startsWith("/lab");

  let role: "patient" | "doctor" | "admin" | "finance" | "lab" = "doctor";
  if (isPatient) role = "patient";
  if (isAdmin) role = "admin";
  if (isFinance) role = "finance";
  if (isLab) role = "lab";

  const pathParts = path.split("/").filter(Boolean);
  const canGoBack = pathParts.length > 1;

  const notifications = [
    { id: 1, text: "Dr. Sarah confirmed your appointment", time: "2m ago", unread: true },
    { id: 2, text: "Lab results are ready to view", time: "1h ago", unread: true },
    { id: 3, text: "Prescription refill approved", time: "3h ago", unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  const userName = isPatient ? "John Doe" : isDoctor ? "Dr. Brandan" : "Admin";
  const userRole = isPatient ? "Patient" : isDoctor ? "Chief Medical Officer" : "System Admin";
  const userInitials = isPatient ? "JD" : isDoctor ? "DB" : "AD";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar — shown for all portals on desktop, overlay on mobile */}
      {!isLanding && (
        <Sidebar
          role={role}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        {!isLanding && (
          <header className="flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-3 md:px-5 gap-2 shrink-0 z-30">
            {/* Left */}
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-accent transition-colors md:hidden"
                onClick={() => setMobileMenuOpen(o => !o)}
              >
                <Menu className="h-5 w-5" />
              </button>
              {canGoBack && (
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("back")}</span>
                </button>
              )}
              <div className="flex items-center gap-2 md:hidden">
                <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Activity className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-sm truncate">Brandan Health</span>
              </div>
            </div>

            {/* Center search */}
            <div className="hidden md:flex flex-1 max-w-sm items-center relative mx-4">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("search")}
                className="w-full pl-9 pr-4 py-2 bg-muted/60 rounded-full text-sm border border-transparent focus:border-primary focus:outline-none focus:bg-background transition-all"
              />
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
              <button onClick={toggle} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Language */}
              <div className="relative">
                <button
                  onClick={() => { setLangOpen(o => !o); setNotifOpen(false); }}
                  className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
                >
                  <Globe className="h-4 w-4" />
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 w-44 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                      {LOCALES.map(l => (
                        <button key={l.code} onClick={() => { setLocale(l.code); setLangOpen(false); }}
                          className={cn("flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors",
                            locale === l.code && "bg-primary/10 text-primary font-semibold")}>
                          <span>{l.flag}</span><span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen(o => !o); setLangOpen(false); }}
                  className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-accent transition-colors relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-border font-semibold text-sm flex items-center justify-between">
                        <span>Notifications</span>
                        <span className="text-xs text-primary font-normal cursor-pointer">Mark all read</span>
                      </div>
                      {notifications.map(n => (
                        <div key={n.id} className={cn("px-4 py-3 hover:bg-accent transition-colors cursor-pointer border-b border-border/50 last:border-0", n.unread && "bg-primary/5")}>
                          <div className="flex items-start gap-2">
                            {n.unread && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                            <div>
                              <p className="text-sm font-medium leading-snug">{n.text}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold leading-tight">{userName}</span>
                  <span className="text-[10px] text-muted-foreground">{userRole}</span>
                </div>
                <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer">
                  {userInitials}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          !isLanding && "p-4 md:p-6",
          isPatient && "pb-24",
          !isPatient && !isLanding && "pb-6"
        )}>
          <Outlet />
        </main>

        {isPatient && <BottomNav />}
      </div>
    </div>
  );
}
