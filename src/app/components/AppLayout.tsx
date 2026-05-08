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

  // Determine portal context
  const isLanding = path === "/";
  const isTreatment = path.startsWith("/treatments");
  const isSupport = path.startsWith("/support-hub") || path.startsWith("/clinical-research");
  const isShop = path.startsWith("/patient/shop");
  
  // Public pages that should NOT have the portal shell (sidebar/header)
  const isPublic = isLanding || isTreatment || isSupport || isShop;

  // Determine Role for Sidebar
  let sidebarRole: "patient" | "doctor" | "admin" | "superadmin" | "pharmacy" = "doctor";
  if (path.startsWith("/patient")) sidebarRole = "patient";
  if (path.startsWith("/admin")) sidebarRole = "admin";
  if (path.startsWith("/superadmin")) sidebarRole = "superadmin";
  if (path.startsWith("/pharmacy")) sidebarRole = "pharmacy";

  // Dynamic user info
  const fullName = user?.user_metadata?.first_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : user?.email || "Guest User";
  
  const displayRole = authRole === "super_admin" ? "Super Admin" : 
                     authRole === "brand_admin" ? "Administrator" : 
                     authRole === "doctor" ? "Provider" : "Patient";

  // Breadcrumb/Back support
  const canGoBack = path.split("/").filter(Boolean).length > 1;

  if (isPublic) {
    return <Outlet />;
  }

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

            {/* Back Button (For Deep Pages) */}
            {canGoBack && sidebarRole === "patient" && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="h-10 w-10 rounded-xl bg-primary/5 text-primary"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group py-1">
              <img src="/originallogo.png" alt="Peak Health Logo" className="h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search health records..." 
              className="w-full pl-11 pr-4 py-2.5 bg-muted/40 rounded-2xl border border-transparent focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/5 text-sm transition-all outline-none"
            />
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
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-70">{displayRole}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => signOut()}
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
