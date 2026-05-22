import { NavLink } from "react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn, Button } from "../../ui/shared.tsx";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { rpmNavItems } from "../../../pages/doctor/rpm/rpmNav";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";

/** Mobile / tablet RPM section navigation */
export function RpmMobileNav() {
  const base = useDoctorPortalBase();
  const items = rpmNavItems(base);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="lg:hidden z-20 shrink-0">
      {/* Quick horizontal scroll — primary sections */}
      <div
        className={cn(
          rpmGlass,
          "mx-2 sm:mx-3 mb-2 flex items-center gap-2 px-2 py-2 overflow-x-auto custom-scrollbar scroll-smooth",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {items.slice(0, 6).map((item) => {
          const end = item.path === `${base}/rpm` || item.path.endsWith("/rpm");
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={end}
              className={({ isActive }) =>
                cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-[#0A2E1F] text-white shadow-md"
                    : "bg-black/5 rpm-dark:bg-white/10 rpm-muted",
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full h-8 px-3 text-[11px] font-bold"
          onClick={() => setSheetOpen((o) => !o)}
        >
          <Menu className="h-3.5 w-3.5 mr-1" />
          More
        </Button>
      </div>

      {/* Full section list */}
      {sheetOpen && (
        <div className={cn(rpmGlass, "mx-2 sm:mx-3 mb-3 p-3 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200")}>
          {items.map((item) => {
            const end = item.path === `${base}/rpm` || item.path.endsWith("/rpm");
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={end}
                onClick={() => setSheetOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold",
                    isActive ? "bg-[#0A2E1F] text-white" : "bg-black/[0.04] rpm-dark:bg-white/[0.06] rpm-text",
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
