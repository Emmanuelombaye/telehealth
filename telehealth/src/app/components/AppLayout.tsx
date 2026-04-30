import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Activity, Bell, Search, User, Menu, ChevronLeft } from "lucide-react";
import { Button } from "./ui/shared";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { cn } from "./ui/utils";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Determine role and portal context
  const isLanding = path === "/";
  const isPatient = path.startsWith("/patient");
  const isProfessional = !isPatient && !isLanding;

  // Determine Role for Sidebar
  let role: "doctor" | "admin" | "finance" | "lab" = "doctor";
  if (path.startsWith("/admin")) role = "admin";
  if (path.startsWith("/finance")) role = "finance";
  if (path.startsWith("/lab")) role = "lab";

  // Breadcrumb/Back support
  const canGoBack = path.split("/").filter(Boolean).length > 1;

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans antialiased text-foreground">
      {/* Desktop Sidebar (Left) */}
      {isProfessional && (
        <div className="hidden md:block h-full">
          <Sidebar role={role} />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header - Glassmorphic Design */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger (For Pros) */}
            {isProfessional && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-primary/5 active:scale-95 transition-all">
                    <Menu className="h-6 w-6 text-primary" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-2xl">
                  <Sidebar role={role} onMobileClose={() => setIsMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>
            )}

            {/* Back Button (For Deep Pages) */}
            {canGoBack && !isProfessional && (
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
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-primary p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Brandan
              </span>
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
                <span className="text-xs font-bold leading-tight">Dr. Harrison Vance</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-70">Chief Medical</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-[1px] shadow-md shadow-primary/20">
                 <div className="h-full w-full rounded-[11px] bg-background flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                 </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden scroll-smooth",
          isPatient ? "pb-28" : "pb-6"
        )}>
          <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation (Patient Portal Only) */}
        {isPatient && <BottomNav />}
      </div>
    </div>
  );
}
