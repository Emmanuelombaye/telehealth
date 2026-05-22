import { NavLink, useLocation } from "react-router";
import { cn } from "../../ui/shared.tsx";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { rpmNavItems } from "../../../pages/doctor/rpm/rpmNav";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";

/** Single horizontal section switcher — replaces duplicate sidebar + in-module nav */
export function RpmSectionTabs() {
  const base = useDoctorPortalBase();
  const location = useLocation();
  const items = rpmNavItems(base);

  return (
    <div
      className={cn(
        rpmGlass,
        "mx-2 sm:mx-4 mb-3 flex items-center gap-1.5 px-2 py-2 overflow-x-auto custom-scrollbar scroll-smooth",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {items.map((item) => {
        const end = item.path === `${base}/rpm` || item.path.endsWith("/rpm");
        const active =
          location.pathname === item.path ||
          (end && (location.pathname === `${base}/rpm` || location.pathname === `${base}/rpm/`));
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={end}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all",
              active
                ? "bg-[#0A2E1F] text-white shadow-md"
                : "rpm-muted hover:rpm-text bg-black/[0.04] rpm-dark:bg-white/[0.06]",
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.label.split(" ")[0]}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
