import { useRef, useState } from "react";
import { NavLink } from "react-router";
import { PanelLeft } from "lucide-react";
import { cn } from "../../ui/shared.tsx";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { rpmNavItems } from "../../../pages/doctor/rpm/rpmNav";
import { rpmGlass } from "../../../../lib/rpmEnterpriseUi";

const CLOSE_DELAY_MS = 320;

/** Desktop RPM rail — collapsed by default, expands on cursor hover */
export function RpmSubNav() {
  const base = useDoctorPortalBase();
  const items = rpmNavItems(base);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setExpanded(true);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setExpanded(false), CLOSE_DELAY_MS);
  };

  return (
    <div
      className="hidden lg:block shrink-0 sticky top-[5.5rem] self-start h-[calc(100dvh-7rem)] m-4 mr-0"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      {/* Wider hit area when collapsed so the rail is easy to discover */}
      <aside
        className={cn(
          rpmGlass,
          "flex h-full flex-col overflow-hidden transition-[width] duration-300 ease-out",
          expanded ? "w-[15.5rem]" : "w-[3.75rem]",
        )}
      >
        <div className="flex items-center gap-2 px-2.5 pt-3 pb-2 border-b border-black/5 rpm-dark:border-white/10 min-h-[44px]">
          <PanelLeft className={cn("h-4 w-4 shrink-0 rpm-muted transition-transform", expanded && "rotate-180")} />
          {expanded && (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] rpm-muted whitespace-nowrap">RPM</p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5 custom-scrollbar space-y-0.5">
          {items.map((item) => {
            const end = item.path === `${base}/rpm` || item.path.endsWith("/rpm");
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={end}
                title={!expanded ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-xl py-2.5 transition-all duration-200",
                    expanded ? "px-3" : "px-2 justify-center",
                    isActive
                      ? "bg-gradient-to-r from-[#0A2E1F] to-emerald-800 text-white shadow-lg shadow-emerald-900/25"
                      : "rpm-muted hover:rpm-text hover:bg-black/[0.04] rpm-dark:hover:bg-white/[0.06]",
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                {expanded && <span className="truncate text-[13px] font-semibold">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {expanded && (
          <div className="px-3 py-3 text-[10px] rpm-muted leading-relaxed border-t border-black/5 rpm-dark:border-white/10">
            Hover edge to expand · live telemetry
          </div>
        )}
      </aside>
    </div>
  );
}
