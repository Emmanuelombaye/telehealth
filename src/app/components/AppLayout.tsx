import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Activity, Bell, Search, User, Menu, ChevronLeft, LogOut } from "lucide-react";
import { Button } from "./ui/shared.tsx";
import { useAuthStore } from "../../lib/auth-store";
import { usePatientStore } from "../../lib/patient-store";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "./ui/utils";
import { supabase } from "../../lib/supabaseClient";
import { PageErrorBoundary } from "./PageErrorBoundary";

export function AppLayout() {
  const { fetchOrders, fetchDoctorAvailability } = usePatientStore();
  
  useEffect(() => {
    fetchOrders();
    fetchDoctorAvailability();
    
    // Real-time synchronization
    const channel = supabase
      .channel('global-order-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('[Realtime] Order Change Detected:', payload);
        fetchOrders();
      })
      .subscribe();

    // Secondary polling to ensure consistency
    const interval = setInterval(() => {
      fetchOrders();
    }, 60000);
    
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, fetchDoctorAvailability]);

  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { user, role: authRole, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const handleLogout = async () => {
    await signOut();
    navigate("/");
    setIsLogoutModalOpen(false);
  };
  
  // Determine Role for Sidebar based on current URL path
  let sidebarRole: "patient" | "doctor" | "admin" | "superadmin" | "pharmacy" = "patient";
  if (path.startsWith("/doctor")) sidebarRole = "doctor";
  else if (path.startsWith("/admin")) sidebarRole = "admin";
  else if (path.startsWith("/superadmin")) sidebarRole = "superadmin";
  else if (path.startsWith("/pharmacy")) sidebarRole = "pharmacy";

  // Dynamic user info
  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Guest User";
  
  const displayRole = authRole?.replace('_', ' ').toUpperCase() || sidebarRole.toUpperCase();

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden font-sans antialiased",
      "bg-[#f8faf9] text-slate-900" 
    )}>
      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6 mx-auto">
              <LogOut className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-center mb-2">Secure Logout?</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center mb-8">Your clinical session will be terminated</p>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="destructive"
                className="h-12 rounded-xl font-black uppercase italic tracking-widest bg-red-600 hover:bg-red-700"
                onClick={handleLogout}
              >
                Terminate Session
              </Button>
              <Button 
                variant="ghost"
                className="h-12 rounded-xl font-black uppercase italic tracking-widest text-slate-400 hover:bg-slate-50"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Stay Logged In
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Left) */}
      <div className="hidden md:block h-full">
        <Sidebar role={sidebarRole} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header - Glassmorphic Design */}
        <header className={cn(
          "sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b px-4 md:px-8 shadow-sm backdrop-blur-xl",
          "border-slate-100 bg-white/95 text-slate-900"
        )}>
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-slate-50 transition-all">
                  <Menu className="h-6 w-6 text-[#0a2e1f]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl bg-white border-slate-100">
                <Sidebar role={sidebarRole} onMobileClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-4">
              <Link to="/" className="hidden sm:block hover:scale-105 transition-transform">
                <img src="/logo-icon.png" alt="Logo" className="h-16 w-auto mix-blend-multiply contrast-125 brightness-110" />
              </Link>
              <div className="h-6 w-[1px] hidden sm:block bg-slate-200" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border text-[#0a2e1f] bg-[#0a2e1f]/5 border-[#0a2e1f]/10">
                {displayRole} PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl group hover:bg-slate-50">
              <Bell className="h-5 w-5 transition-colors text-slate-400 group-hover:text-[#0a2e1f]" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#ef4444] border-2 border-white animate-pulse" />
            </Button>
            
            <div className="h-8 w-[1px] mx-1 hidden sm:block bg-slate-200" />

            <div className="flex items-center gap-3 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold leading-tight text-slate-900">{fullName}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 text-slate-500">
                  {sidebarRole === 'doctor' ? 'Clinical Provider' : sidebarRole === 'admin' ? 'Brand Admin' : sidebarRole === 'superadmin' ? 'Super Admin' : 'Patient'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsLogoutModalOpen(true)}
                className="h-11 w-11 rounded-2xl transition-colors bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pb-12">
          <PageErrorBoundary>
            <div className="w-full max-w-7xl mx-auto p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
    </div>
  );
}
