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
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans antialiased bg-white text-[#0A0D14]">
      {/* PROFESSIONAL END-TO-END HEADER (Executive Scale) */}
      <header className={cn(
        "sticky top-0 z-50 flex w-full h-32 items-center border-b px-8 md:px-12 shadow-sm backdrop-blur-md transition-all duration-300 shrink-0",
        "border-slate-100 bg-white/95 text-[#0A0D14]",
        scrolled && "h-20 shadow-md shadow-emerald-950/5"
      )}>
        {/* Left Section: Context & Navigation */}
        <div className="flex items-center gap-8 flex-1 relative z-10">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-12 w-12 rounded-xl hover:bg-slate-50 transition-all">
                <Menu className="h-8 w-8 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 border-r-0 shadow-2xl bg-white">
              <div className="sr-only">
                <SheetTitle>Clinical Navigation</SheetTitle>
                <SheetDescription>Main control portal</SheetDescription>
              </div>
              <Sidebar role={sidebarRole} onMobileClose={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          
          <div className="hidden lg:flex items-center gap-4">
             <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
               <Activity className="h-5 w-5 text-emerald-700" />
             </div>
             <div className="flex flex-col">
               <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600/60 leading-tight">Clinical Operations</span>
               <span className="text-[15px] font-bold text-slate-400">Peak Health Center</span>
             </div>
          </div>
        </div>

        {/* Center Section: BRAND IDENTITY (Bold High-Luxe Scale) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Link to={`/${sidebarRole}`} className="flex items-center pointer-events-auto hover:opacity-80 transition-all duration-300">
            <img 
              src="/PeakHealthLogo.png" 
              alt="Peak Health" 
              className={cn(
                "h-20 md:h-24 w-auto object-contain transition-all duration-300",
                scrolled && "h-14"
              )}
            />
          </Link>
        </div>

        {/* Right Section: Telemetry & Identity */}
        <div className="flex items-center gap-3 flex-1 justify-end relative z-10">
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
                {sidebarRole === 'doctor' ? 'Licensed Provider' : sidebarRole === 'admin' ? 'System Operator' : sidebarRole === 'superadmin' ? 'Root Authority' : 'Verified User'}
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
        <div className="hidden md:block h-full shrink-0 border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <Sidebar role={sidebarRole} />
        </div>

        <main 
          onScroll={onScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pb-12 bg-[#FBFBFC]"
        >
          <PageErrorBoundary>
            <div className="w-full max-w-[1600px] mx-auto p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
