import { NavLink } from "react-router";
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  FileText, 
  User 
} from "lucide-react";
import { cn } from "./ui/shared";

export function BottomNav() {
  const navItems = [
    { icon: Home, label: "Home", href: "/patient" },
    { icon: Calendar, label: "Book", href: "/patient/book" },
    { icon: MessageSquare, label: "Chat", href: "/patient/chat" },
    { icon: FileText, label: "Records", href: "/patient/records" },
    { icon: User, label: "Profile", href: "/patient/profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background px-2 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center space-y-1 px-3 py-1 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <item.icon className={cn("h-5 w-5")} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
