import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Activity, Bell, Menu, LogOut } from "lucide-react";
import { Button } from "./ui/shared.tsx";
import { useAuthStore } from "../../lib/auth-store";
import { usePatientStore } from "../../lib/patient-store";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { useState, useEffect, Suspense } from "react";
import { cn } from "./ui/utils";
import { supabase } from "../../lib/supabaseClient";
import { doctorPortalBaseFromPath } from "../../lib/doctorPortalBase";
import { PageErrorBoundary } from "./PageErrorBoundary";
import { LogoutConfirmation } from "./LogoutConfirmation";
import { AuthLoadingScreen } from "./ProtectedRoute";
import { motion } from "framer-motion";
import { doctorPortalBackground, doctorMainBackground } from "../../lib/doctorPortalUi";

export function AppLayout() {
  const fetchOrders = usePatientStore(state => state.fetchOrders);
  const fetchPrescriptions = usePatientStore(state => state.fetchPrescriptions);
  const fetchVisitForms = usePatientStore(state => state.fetchVisitForms);
  const fetchNotifications = usePatientStore(state => state.fetchNotifications);
  const fetchDoctorAvailability = usePatientStore(state => state.fetchDoctorAvailability);
  const fetchUnreadMessages = usePatientStore(state => state.fetchUnreadMessages);
  const subscribeToOrders = usePatientStore(state => state.subscribeToOrders);
  const unreadMessagesCount = usePatientStore(state => state.unreadMessagesCount);
  const notifications = usePatientStore(state => state.notifications);
  const unreadNotificationsCount = notifications.filter((n) => n?.unread).length;
  const totalNotifications = unreadMessagesCount + unreadNotificationsCount;
  
  useEffect(() => {
    fetchOrders();
    fetchPrescriptions();
    fetchVisitForms();
    fetchNotifications();
    fetchDoctorAvailability();
    fetchUnreadMessages();
    
    // Global real-time telemetry subscription
    const unsubscribe = subscribeToOrders();

    const interval = setInterval(() => {
      fetchOrders();
      fetchPrescriptions();
      fetchVisitForms();
      fetchNotifications();
      fetchUnreadMessages();
    }, 60000);
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchOrders, fetchPrescriptions, fetchVisitForms, fetchNotifications, fetchDoctorAvailability, fetchUnreadMessages, subscribeToOrders]);

  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { user, role: authRole, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const onScroll = (e: React.UIEvent<HTMLElement>) => {
    setScrolled(e.currentTarget.scrollTop > 20);
  };
  
  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };
  
  // Determine Role for Sidebar based on current URL path
  let sidebarRole: "patient" | "doctor" | "admin" | "superadmin" | "affiliate" = "patient";
  if (path.startsWith("/doctor") || path.startsWith("/providers")) sidebarRole = "doctor";
  else if (path.startsWith("/admin")) sidebarRole = "admin";
  else if (path.startsWith("/superadmin")) sidebarRole = "superadmin";
  else if (path.startsWith("/affiliate")) sidebarRole = "affiliate";

  const isPatientPortal = path.startsWith("/patient");
  const isSuperAdminPortal = path.startsWith("/superadmin");
  const isDoctorPortal = path.startsWith("/doctor") || path.startsWith("/providers");
  /** Brand + platform ops: always light, high-contrast surface (see theme.css `.staff-admin-surface`). */
  const isStaffAdminPortal = path.startsWith("/admin") || path.startsWith("/superadmin");

  // Dynamic user info
  const fullName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user?.email
      ? user.email
      : isSuperAdminPortal
        ? "Platform administrator"
        : "Guest User";
  
  const displayRole = authRole?.replace('_', ' ').toUpperCase() || sidebarRole.toUpperCase();
  const staffPortalLogoHome =
    sidebarRole === "doctor" ? doctorPortalBaseFromPath(path) : `/${sidebarRole}`;

  return (
    <div
      className={cn(
        "flex flex-col h-screen w-full overflow-hidden font-sans antialiased text-[#0A0D14]",
        isStaffAdminPortal && "staff-admin-surface",
        isPatientPortal
          ? "bg-gradient-to-br from-emerald-50/80 via-white to-slate-50/90"
          : isSuperAdminPortal
            ? "bg-slate-100/90"
            : isDoctorPortal
              ? doctorPortalBackground
              : "bg-white",
      )}
    >
      {/* Header: grid keeps the mark optically centered without overlapping side controls */}
      <header
        className={cn(
          "sticky top-0 z-50 grid w-full shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b px-3 py-3 shadow-sm backdrop-blur-xl transition-[box-shadow,min-height] duration-300 sm:gap-3 sm:px-5 md:px-8",
          scrolled ? "min-h-[4.25rem] shadow-md md:min-h-[4.5rem]" : "min-h-[4.75rem] md:min-h-[5.25rem]",
          isPatientPortal
            ? "border-emerald-100/70 bg-white/88 shadow-emerald-950/[0.035]"
            : isDoctorPortal
              ? "border-emerald-100/75 bg-white/82 shadow-[0_8px_32px_-14px_rgba(16,185,129,0.22)] backdrop-blur-xl"
              : "border-slate-100 bg-white/95",
          "text-[#0A0D14]",
        )}
      >
        <div className="flex min-w-0 items-center justify-start gap-2 md:gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-11 w-11 shrink-0 rounded-xl hover:bg-slate-100/80 transition-colors">
                <Menu className="h-6 w-6 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 border-r-0 shadow-2xl bg-white">
              <div className="sr-only">
                <SheetTitle>Clinical Navigation</SheetTitle>
                <SheetDescription>Main control portal</SheetDescription>
              </div>
              <PageErrorBoundary pageName="Sidebar navigation">
                <Sidebar role={sidebarRole} onMobileClose={() => setIsMobileMenuOpen(false)} />
              </PageErrorBoundary>
            </SheetContent>
          </Sheet>

          <div className="hidden min-w-0 lg:flex items-center gap-3">
            <div
              className={cn(
                "shrink-0 rounded-xl border p-2.5",
                isPatientPortal
                  ? "border-emerald-100/80 bg-emerald-50/60"
                  : isDoctorPortal
                    ? "border-emerald-200/85 bg-emerald-50/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                    : "border-slate-100 bg-slate-50/80",
              )}
            >
              <Activity
                className={cn(
                  "h-5 w-5",
                  isPatientPortal ? "text-emerald-700" : isDoctorPortal ? "text-emerald-700" : "text-slate-600",
                )}
              />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700/65 md:text-[11px]">
                {path.startsWith("/doctor") || path.startsWith("/providers")
                  ? "Clinical command"
                  : isPatientPortal
                    ? "Your care"
                    : isSuperAdminPortal
                      ? "Platform governance"
                      : path.startsWith("/admin")
                        ? authRole === "super_admin"
                          ? "Brand workspace · elevated"
                          : "Brand administration"
                        : "Operations"}
              </span>
              <span className="truncate text-sm font-semibold text-slate-500 md:text-[15px]">
                {isPatientPortal
                  ? "Peak Health"
                  : isSuperAdminPortal
                    ? "Super Admin portal"
                    : path.startsWith("/admin")
                      ? "Non-clinical operations"
                      : "Peak Health Center"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 justify-center px-2 sm:px-4">
          {isPatientPortal ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full max-w-[min(94vw,28rem)] justify-center sm:max-w-[30rem] md:max-w-[32rem]"
            >
              <Link
                to="/patient"
                className="flex items-center justify-center outline-none transition-opacity hover:opacity-90 focus-visible:opacity-90"
              >
                <img
                  src="/PeakHealthLogo.png"
                  alt="Peak Health"
                  width={320}
                  height={120}
                  decoding="async"
                  className={cn(
                    "block h-[3rem] w-auto max-h-none object-contain object-center sm:h-[3.5rem] md:h-[4.5rem] lg:h-[5rem]",
                    scrolled && "h-[2.65rem] sm:h-[3.1rem] md:h-[3.75rem] lg:h-[4.1rem]",
                  )}
                />
              </Link>
            </motion.div>
          ) : (
            <Link
              to={staffPortalLogoHome}
              className="flex w-full max-w-[min(96vw,40rem)] items-center justify-center outline-none transition-opacity hover:opacity-90 md:max-w-[44rem]"
            >
              <img
                src="/PeakHealthLogo.png"
                alt="Peak Health"
                width={640}
                height={240}
                decoding="async"
                className={cn(
                  "block h-[3.25rem] w-auto max-w-full object-contain object-center sm:h-[3.75rem] md:h-[4.5rem] lg:h-[5.25rem] xl:h-[5.75rem]",
                  scrolled &&
                    "h-[2.85rem] sm:h-[3.25rem] md:h-14 lg:h-[4.25rem] xl:h-[4.75rem]",
                )}
              />
            </Link>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <div className="flex items-center gap-2 pr-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(`/${sidebarRole}/notifications`)}
              className="relative h-10 w-10 rounded-xl group hover:bg-emerald-50/50 transition-all"
            >
              <Bell className="h-5 w-5 transition-colors text-slate-400 group-hover:text-emerald-700" />
              {totalNotifications > 0 && (
                <span className="absolute top-2 right-2 h-4 min-w-[1rem] px-1 rounded-full bg-emerald-600 border-2 border-white text-[8px] font-black text-white flex items-center justify-center">
                  {totalNotifications}
                </span>
              )}
            </Button>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block" />

          <div className="flex items-center gap-4 pl-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[14px] font-bold tracking-tight text-slate-900 leading-tight">{fullName}</span>
              <span className="text-[9px] uppercase font-black tracking-[0.2em] text-emerald-600/70">
                {sidebarRole === "doctor"
                  ? "Licensed provider"
                  : sidebarRole === "admin"
                    ? "System operator"
                    : sidebarRole === "superadmin"
                      ? "Super administrator"
                      : sidebarRole === "affiliate"
                        ? "Affiliate partner"
                        : sidebarRole === "patient"
                          ? "Patient account"
                          : "Verified user"}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLogoutConfirm(true)}
              className="h-10 w-10 rounded-xl transition-all bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent shadow-sm"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar (Left) */}
        <div
          className={cn(
            "hidden md:block h-full shrink-0 border-r shadow-[4px_0_28px_-8px_rgba(10,46,31,0.06)]",
            isDoctorPortal ? "border-emerald-100/70 bg-emerald-50/20" : "border-slate-100",
          )}
        >
          <PageErrorBoundary pageName="Sidebar navigation">
            <Sidebar role={sidebarRole} />
          </PageErrorBoundary>
        </div>

        <main
          onScroll={onScroll}
          className={cn(
            "flex min-h-0 min-w-0 flex-1 scroll-smooth",
            /** Staff dashboards use wide grids/tables — allow horizontal scroll; patient keeps clipped horizontal bleed. */
            isPatientPortal ? "overflow-x-hidden overflow-y-auto" : "overflow-x-auto overflow-y-auto",
            isPatientPortal ? "pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-12" : "pb-12",
            isPatientPortal
              ? "bg-gradient-to-b from-transparent via-[#FBFBFC] to-emerald-50/20"
              : isDoctorPortal
                ? doctorMainBackground
                : isSuperAdminPortal
                  ? "bg-slate-50"
                  : "bg-[#FBFBFC]",
          )}
        >
          <PageErrorBoundary>
            <div
              className={cn(
                "mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700",
                isDoctorPortal && "relative isolate",
                isPatientPortal
                  ? "max-w-[1240px] px-4 py-6 sm:px-6 md:px-10 md:py-10"
                  : isDoctorPortal
                    ? "max-w-[1600px] px-4 py-5 md:px-7 md:py-8"
                    : /** Brand admin & superadmin: same usable width — protocol tables span many columns */
                      "max-w-[1600px] p-6 md:p-10",
              )}
            >
              {isDoctorPortal && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                  <div className="absolute -top-44 -right-24 h-[min(520px,70vw)] w-[min(520px,70vw)] rounded-full bg-emerald-300/18 blur-[100px]" />
                  <div className="absolute top-[22%] -left-32 h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-teal-300/14 blur-[88px]" />
                  <div className="absolute bottom-8 right-[12%] h-56 w-56 rounded-full bg-cyan-200/22 blur-[72px]" />
                </div>
              )}
              <div className={cn(isDoctorPortal && "relative z-[1]")}>
                <Suspense fallback={
                  <div className="w-full h-[60vh] flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin" />
                  </div>
                }>
                  <Outlet />
                </Suspense>
              </div>
            </div>
          </PageErrorBoundary>
        </main>

        {sidebarRole === "patient" && (
          <div className="md:hidden">
            <BottomNav />
          </div>
        )}
      </div>

      <LogoutConfirmation 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
