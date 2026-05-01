import { NavLink, useLocation } from "react-router";
import { Home, Calendar, MessageSquare, FileText, User } from "lucide-react";
import { cn } from "./ui/shared";
import { useI18n } from "../../lib";

const navItems = [
  { icon: Home, labelKey: "nav.home", href: "/patient", exact: true, badge: 0 },
  { icon: Calendar, labelKey: "nav.book", href: "/patient/appointments", exact: false, badge: 1 },
  { icon: MessageSquare, labelKey: "nav.chat", href: "/patient/messages", exact: false, badge: 3 },
  { icon: FileText, labelKey: "nav.records", href: "/patient/documents", exact: false, badge: 0 },
  { icon: User, labelKey: "nav.profile", href: "/patient/profile", exact: false, badge: 0 },
];

export function BottomNav() {
  const { t } = useI18n();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 bg-primary rounded-full" />
              )}
              <div className={cn(
                "relative flex items-center justify-center h-9 w-9 rounded-2xl transition-all duration-200",
                isActive ? "bg-primary/10" : "active:scale-90"
              )}>
                <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium leading-none transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                {t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
