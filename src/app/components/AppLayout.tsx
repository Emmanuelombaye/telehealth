import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Activity, Bell, Search, User, Menu, ChevronLeft, LogOut } from "lucide-react";
import { Button } from "./ui/shared.tsx";
import { useAuthStore } from "../../lib";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { cn } from "./ui/utils";

export function AppLayout() {
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans antialiased text-foreground">
      {/* Desktop Sidebar (Left) */}
      <div className="hidden md:block h-full">
        <Sidebar role={sidebarRole} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header - Glassmorphic Design */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-primary/5 active:scale-95 transition-all">
                  <Menu className="h-6 w-6 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl">
                <Sidebar role={sidebarRole} onMobileClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Portal Identity */}
            <div className="flex items-center gap-4">
               <div className="hidden sm:block">
                 <img src="/originallogo.png" alt="Logo" className="h-10 w-auto" />
               </div>
               <div className="h-6 w-[1px] bg-border/60 hidden sm:block" />
               <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                 {displayRole} PORTAL
               </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-primary/5 group">
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-background animate-pulse" />
            </Button>
            
            <div className="h-8 w-[1px] bg-border/60 mx-1 hidden sm:block" />

            <div className="flex items-center gap-3 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold leading-tight">{fullName}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-70">
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
                className="h-10 w-10 rounded-xl bg-primary/5 text-primary hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden scroll-smooth",
          "pb-6"
        )}>
          <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
