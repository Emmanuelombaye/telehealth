import { NavLink } from "react-router";
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  FileText, 
  User 
} from "lucide-react";
import { cn } from "./ui/shared";
import { motion } from "motion";

export function BottomNav() {
  const navItems = [
    { icon: Home, label: "Home", href: "/patient" },
    { icon: Calendar, label: "Book", href: "/patient/book" },
    { icon: MessageSquare, label: "Chat", href: "/patient/chat" },
    { icon: FileText, label: "Records", href: "/patient/records" },
    { icon: User, label: "Profile", href: "/patient/profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-border/40 bg-background/80 backdrop-blur-xl px-2 pb-6 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center justify-center space-y-1.5 px-3 py-1 transition-all duration-300",
              isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <motion.div
                whileTap={{ scale: 0.8 }}
                className="relative"
              >
                <item.icon className={cn("h-6 w-6 transition-transform", isActive && "stroke-[2.5px]")} />
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary"
                  />
                )}
              </motion.div>
              <span className={cn(
                "text-[10px] font-bold tracking-tight uppercase transition-all",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
