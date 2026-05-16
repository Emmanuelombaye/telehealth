import { NavLink } from "react-router";
import { Home, Calendar, MessageSquare, Package, User } from "lucide-react";
import { cn } from "./ui/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const navItems = [
    { icon: Home, label: "Home", href: "/patient" },
    { icon: Package, label: "Shop", href: "/patient/shop" },
    { icon: Calendar, label: "Visits", href: "/patient/appointments" },
    { icon: MessageSquare, label: "Messages", href: "/patient/messages" },
    { icon: User, label: "Profile", href: "/patient/profile" },
  ];

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "border-t border-emerald-100/80 bg-white/90 backdrop-blur-2xl",
        "shadow-[0_-8px_32px_-8px_rgba(6,78,59,0.12)]",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2",
      )}
      aria-label="Patient navigation"
    >
      <div className="mx-auto flex h-[3.35rem] max-w-lg items-stretch justify-between gap-0.5 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={
              item.href === "/patient"
                ? true
                : item.href === "/patient/shop"
                  ? false
                  : true
            }
            className={({ isActive }) =>
              cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-colors duration-200",
                isActive ? "text-emerald-800" : "text-slate-400 hover:text-emerald-700/90",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="patientBottomNavPill"
                    className="absolute inset-x-0.5 inset-y-0 rounded-xl bg-emerald-500/[0.11] ring-1 ring-emerald-600/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex h-8 w-8 items-center justify-center">
                  <item.icon
                    className={cn(
                      "h-[1.35rem] w-[1.35rem] transition-transform duration-200",
                      isActive && "scale-[1.06] text-emerald-800",
                    )}
                    strokeWidth={isActive ? 2.35 : 2}
                  />
                </span>
                <span
                  className={cn(
                    "relative max-w-full truncate text-[10px] font-semibold tracking-tight",
                    isActive ? "text-emerald-900" : "text-slate-500",
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
