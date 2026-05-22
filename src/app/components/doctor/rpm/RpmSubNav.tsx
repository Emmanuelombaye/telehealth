import { NavLink } from "react-router";
import { cn } from "../../ui/shared.tsx";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { rpmNavItems } from "../../../pages/doctor/rpm/rpmNav";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";

export function RpmSubNav() {
  const base = useDoctorPortalBase();
  const items = rpmNavItems(base);

  return (
    <aside
      className={cn(
        rpmGlass,
        "hidden lg:flex w-[15.5rem] shrink-0 flex-col m-4 mr-0 p-3 max-h-[calc(100dvh-7rem)] sticky top-[5.5rem] overflow-y-auto custom-scrollbar",
      )}
    >
      <p className="px-3 pt-2 pb-3 text-[10px] font-black uppercase tracking-[0.2em] rpm-muted">RPM Monitoring</p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const end = item.path === `${base}/rpm` || item.path.endsWith("/rpm");
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#0A2E1F] to-emerald-800 text-white shadow-lg shadow-emerald-900/25"
                    : "rpm-muted hover:rpm-text hover:bg-black/[0.04] rpm-dark:hover:bg-white/[0.06]",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0 opacity-90" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 px-2 text-[10px] rpm-muted leading-relaxed">
        Enterprise RPM · wired to live telemetry
      </div>
    </aside>
  );
}
