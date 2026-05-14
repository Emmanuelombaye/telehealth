import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./ui/dialog";
import {
  LayoutDashboard,
  ClipboardList,
  Stethoscope,
  MessageSquare,
  Calendar,
  Activity,
  Bell,
  Users,
  FlaskConical,
  Bot,
  Pill,
  HeartPulse,
  Image as ImageIcon,
  ArrowRightLeft,
  CreditCard,
  BookOpen,
  Command,
  Radio,
  Search,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useDoctorClinicalMetrics } from "../../lib/doctorClinicalMetrics";
import { useDoctorPortalBase } from "../../lib/doctorPortalBase";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  to: string;
  icon: typeof LayoutDashboard;
  section: string;
};

const COMMANDS: Cmd[] = [
  { id: "dash", label: "Overview", to: "/doctor", icon: LayoutDashboard, section: "Clinical" },
  { id: "queue", label: "Clinical queue", hint: "Triage & e-prescribe", to: "/doctor/queue", icon: ClipboardList, section: "Clinical" },
  { id: "consult", label: "Case workspace", hint: "SOAP, video, approve, refund", to: "/doctor/consult", icon: Stethoscope, section: "Clinical" },
  { id: "patients", label: "Patient roster", to: "/doctor/patients", icon: Users, section: "Clinical" },
  { id: "messages", label: "Secure messages", to: "/doctor/messages", icon: MessageSquare, section: "Coordination" },
  { id: "schedule", label: "Calendar embed", to: "/doctor/schedule", icon: Calendar, section: "Coordination" },
  { id: "availability", label: "On-call availability", to: "/doctor/availability", icon: Activity, section: "Coordination" },
  { id: "notif", label: "Notifications", to: "/doctor/notifications", icon: Bell, section: "Coordination" },
  { id: "labs", label: "Lab requests", to: "/doctor/labs", icon: FlaskConical, section: "Diagnostics" },
  { id: "imaging", label: "Imaging", to: "/doctor/imaging", icon: ImageIcon, section: "Diagnostics" },
  { id: "scribe", label: "AI scribe", to: "/doctor/scribe", icon: Bot, section: "Diagnostics" },
  { id: "erx", label: "e-Prescribing", to: "/doctor/erx", icon: Pill, section: "Diagnostics" },
  { id: "rpm", label: "Remote monitoring", to: "/doctor/rpm", icon: Radio, section: "Programs" },
  { id: "referrals", label: "Referrals", to: "/doctor/referrals", icon: ArrowRightLeft, section: "Programs" },
  { id: "billing", label: "Billing & encounters", to: "/doctor/billing", icon: CreditCard, section: "Programs" },
  { id: "education", label: "Patient education", to: "/doctor/education", icon: BookOpen, section: "Programs" },
];

export function DoctorCommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const metrics = useDoctorClinicalMetrics();
  const doctorBase = useDoctorPortalBase();

  const commands = useMemo(
    () =>
      COMMANDS.map((c) => ({
        ...c,
        to: c.to.replace(/^\/doctor/, doctorBase),
      })),
    [doctorBase],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(s) ||
        c.hint?.toLowerCase().includes(s) ||
        c.section.toLowerCase().includes(s)
    );
  }, [q, commands]);

  const run = useCallback(
    (to: string) => {
      navigate(to);
      setOpen(false);
      setQ("");
    },
    [navigate]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, Cmd[]>();
    for (const c of filtered) {
      if (!m.has(c.section)) m.set(c.section, []);
      m.get(c.section)!.push(c);
    }
    return [...m.entries()];
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 shadow-sm hover:border-emerald-300/60 hover:bg-emerald-50/40 transition-colors"
      >
        <Command className="h-3.5 w-3.5 text-emerald-700" />
        Command
        <kbd className="hidden sm:inline rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
          ⌘K
        </kbd>
      </button>

      <DialogContent className="sm:max-w-lg gap-0 overflow-hidden border-slate-200 p-0 shadow-2xl">
        <DialogTitle className="sr-only">Clinical command palette</DialogTitle>
        <div className="border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400/90">Peak Health · Physician</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-white/80">
            <span className="rounded-full bg-white/10 px-2 py-0.5">
              Inbox {metrics.pendingDecision}
            </span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-100">
              Video {metrics.videoActionRequired}
            </span>
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-100">
              Follow-up {metrics.followUp}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to module…"
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
          {grouped.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No matches.</p>
          ) : (
            grouped.map(([section, items]) => (
              <div key={section} className="mb-2">
                <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{section}</p>
                <ul>
                  {items.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => run(c.to)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-800",
                          "hover:bg-emerald-50/80 transition-colors"
                        )}
                      >
                        <c.icon className="h-4 w-4 shrink-0 text-emerald-700" />
                        <span className="flex-1">
                          {c.label}
                          {c.hint && (
                            <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{c.hint}</span>
                          )}
                        </span>
                        <ChevronMini />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChevronMini() {
  return <span className="text-slate-300 text-xs">↵</span>;
}
