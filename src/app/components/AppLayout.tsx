import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Activity, Bell, Search, User, Menu, ChevronLeft, LogOut } from "lucide-react";
import { Button } from "./ui/shared.tsx";
import { useAuthStore } from "../../lib";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { cn } from "./ui/utils";
import { usePatientStore } from "../../lib";
import { useEffect } from "react";

export function AppLayout() {
  const { fetchOrders, fetchDoctorAvailability } = usePatientStore();
  
  useEffect(() => {
    fetchOrders();
    fetchDoctorAvailability();
    
    // Refresh every minute to keep badges accurate
    const interval = setInterval(() => {
      fetchOrders();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchOrders, fetchDoctorAvailability]);

  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const { user, role: authRole, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  // Breadcrumb/Back support
  const canGoBack = path.split("/").filter(Boolean).length > 1;

  const isAdminPortal = sidebarRole === "admin" || sidebarRole === "superadmin" || sidebarRole === "doctor";

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden font-sans antialiased",
      isAdminPortal ? "bg-[#060807] text-[#e2e8f0]" : "bg-background text-foreground"
    )}>
      {/* Desktop Sidebar (Left) */}
      <div className="hidden md:block h-full">
        <Sidebar role={sidebarRole} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header - Glassmorphic Design */}
        <header className={cn(
          "sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 md:px-6 shadow-sm backdrop-blur-xl",
          isAdminPortal 
            ? "border-[#1a2620] bg-[#060807]/80 text-[#e2e8f0]" 
            : "border-border/40 bg-background/80 text-foreground"
        )}>
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-primary/5 active:scale-95 transition-all">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl bg-[#0c120f] border-[#1a2620]">
                <Sidebar role={sidebarRole} onMobileClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Portal Identity */}
            <div className="flex items-center gap-4">
               <div className="hidden sm:block">
                 <img src="/originallogo.png" alt="Logo" className="h-10 w-auto brightness-110" />
               </div>
               <div className={cn("h-6 w-[1px] hidden sm:block", isAdminPortal ? "bg-[#1a2620]" : "bg-border/60")} />
               <span className={cn(
                 "text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border",
                 isAdminPortal 
                   ? "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20" 
                   : "text-primary bg-primary/5 border-primary/10"
               )}>
                 {displayRole} PORTAL
               </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className={cn(
              "relative h-10 w-10 rounded-xl group",
              isAdminPortal ? "hover:bg-[#1a2620]" : "hover:bg-primary/5"
            )}>
              <Bell className={cn("h-5 w-5 transition-colors", isAdminPortal ? "text-[#7f9488] group-hover:text-[#22c55e]" : "text-muted-foreground group-hover:text-primary")} />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-background animate-pulse" />
            </Button>
            
            <div className={cn("h-8 w-[1px] mx-1 hidden sm:block", isAdminPortal ? "bg-[#1a2620]" : "bg-border/60")} />

            <div className="flex items-center gap-3 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className={cn("text-xs font-bold leading-tight", isAdminPortal ? "text-[#e2e8f0]" : "text-foreground")}>{fullName}</span>
                <span className={cn(
                  "text-[10px] uppercase font-bold tracking-widest opacity-70",
                  isAdminPortal ? "text-[#7f9488]" : "text-muted-foreground"
                )}>
                  {sidebarRole === 'doctor' ? 'Clinical Provider' : sidebarRole === 'admin' ? 'Brand Admin' : sidebarRole === 'superadmin' ? 'Super Admin' : 'Patient'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (window.confirm("Are you sure you want to sign out?")) {
                    signOut();
                    navigate("/");
                  }
                }}
                className={cn(
                  "h-10 w-10 rounded-xl transition-colors",
                  isAdminPortal 
                    ? "bg-[#1a2620] text-[#7f9488] hover:bg-[#ef4444]/10 hover:text-[#ef4444]" 
                    : "bg-primary/5 text-primary hover:bg-destructive/10 hover:text-destructive"
                )}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden scroll-smooth",
          "pb-6",
          isAdminPortal ? "bg-[#060807]" : ""
        )}>
          <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
