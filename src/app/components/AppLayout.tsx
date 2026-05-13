import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Activity, Bell, Search, User, Menu, ChevronLeft, LogOut, Home } from "lucide-react";
import { Button } from "./ui/shared.tsx";
import { useAuthStore } from "../../lib/auth-store";
import { usePatientStore } from "../../lib/patient-store";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "./ui/utils";
import { supabase } from "../../lib/supabaseClient";
import { PageErrorBoundary } from "./PageErrorBoundary";
import { LogoutConfirmation } from "./LogoutConfirmation";

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
  const unreadNotificationsCount = notifications.filter(n => n.unread).length;
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
  let sidebarRole: "patient" | "doctor" | "admin" | "superadmin" = "patient";
  if (path.startsWith("/doctor")) sidebarRole = "doctor";
  else if (path.startsWith("/admin")) sidebarRole = "admin";
  else if (path.startsWith("/superadmin")) sidebarRole = "superadmin";

  // Dynamic user info
  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Guest User";
  
  const displayRole = authRole?.replace('_', ' ').toUpperCase() || sidebarRole.toUpperCase();

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden font-sans antialiased bg-white text-[#0A0D14]"
    )}>

      {/* Desktop Sidebar (Left) */}
      <div className="hidden md:block h-full">
        <Sidebar role={sidebarRole} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header - Glassmorphic Design */}
        <header className={cn(
          "sticky top-0 z-50 flex w-full h-24 items-center border-b px-8 shadow-sm backdrop-blur-xl transition-all duration-300",
          "border-slate-50 bg-white/90 text-[#0A0D14]",
          scrolled && "shadow-xl shadow-emerald-900/5"
        )}>
          {/* Left Section: Mobile Toggle & Breadcrumb Space */}
          <div className="flex items-center gap-3 flex-1">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-slate-50 transition-all">
                  <Menu className="h-6 w-6 text-[#0a2e1f]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl bg-white border-slate-100">
                <div className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Access all clinical and administrative portals</SheetDescription>
                </div>
                <Sidebar role={sidebarRole} onMobileClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            
            <div className="hidden sm:flex items-center gap-2 text-slate-300">
               <Home className="h-4 w-4" />
               <ChevronLeft className="h-3 w-3 rotate-180" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portal</span>
            </div>
          </div>

          {/* Center Section: THE LOGO (Enlarged & Centered) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <Link to={`/${sidebarRole}`} className="flex items-center hover:opacity-80 transition-all duration-500 hover:scale-105">
              <img 
                src="/PeakHealthLogo.png" 
                alt="Peak Health" 
                className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
              />
            </Link>
          </div>

          {/* Right Section: Actions & Profile */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/patient/notifications")}
              className="relative h-10 w-10 rounded-xl group hover:bg-slate-50"
            >
              <Bell className="h-5 w-5 transition-colors text-slate-400 group-hover:text-[#0a2e1f]" />
              {totalNotifications > 0 && (
                <span className="absolute top-2 right-2 h-4 min-w-[1rem] px-1 rounded-full bg-[#ef4444] border-2 border-white text-[8px] font-black text-white flex items-center justify-center animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </Button>
            
            <div className="h-8 w-[1px] mx-1 hidden sm:block bg-slate-200" />

            <div className="flex items-center gap-4 pl-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-black tracking-tight text-[#0A0D14]">{fullName}</span>
                <span className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400">
                  {sidebarRole === 'doctor' ? 'Clinical Provider' : sidebarRole === 'admin' ? 'Operator' : sidebarRole === 'superadmin' ? 'Authority' : 'Identity Verified'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowLogoutConfirm(true)}
                className="h-12 w-12 rounded-2xl transition-all bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main 
          onScroll={onScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pb-12 bg-white"
        >
          <PageErrorBoundary>
            <div className="w-full max-w-[1400px] mx-auto p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Outlet />
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
