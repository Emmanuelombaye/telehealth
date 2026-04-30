import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Activity, Bell, Search, User } from "lucide-react";
import { Button } from "./ui/shared";

export function AppLayout() {
  const location = useLocation();
  const path = location.pathname;

  // Determine role from path
  const isPatient = path.startsWith("/patient");
  const isDoctor = path.startsWith("/doctor");
  const isAdmin = path.startsWith("/admin");
  const isFinance = path.startsWith("/finance");
  const isLab = path.startsWith("/lab");

  let role: "doctor" | "admin" | "finance" | "lab" = "doctor";
  if (isAdmin) role = "admin";
  if (isFinance) role = "finance";
  if (isLab) role = "lab";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar for professional portals */}
      {!isPatient && path !== "/" && <Sidebar role={role} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {path !== "/" && (
          <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
            <div className="flex items-center space-x-4 md:hidden">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-bold">Brandan Health</span>
            </div>
            
            <div className="hidden md:flex flex-1 max-w-md items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search patient, records, etc..." 
                className="w-full pl-10 pr-4 py-2 bg-muted/50 rounded-full border-none text-sm focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <div className="flex items-center space-x-2 border-l border-border pl-4">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-medium">Dr. Brandan</span>
                  <span className="text-xs text-muted-foreground">Chief Medical Officer</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Bottom Nav for Patients */}
        {isPatient && <BottomNav />}
      </div>
    </div>
  );
}
