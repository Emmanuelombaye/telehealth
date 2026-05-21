import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Bell,
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  ShieldCheck,
  CheckCheck,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  HeartPulse,
  ClipboardList,
  Video,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { Card, CardContent, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore, usePatientStore } from "../../../../lib";
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import {
  buildClinicalAlerts,
  formatAlertTime,
  mergeAlertFeed,
  NOTIFICATION_TYPE_STYLES,
  SEVERITY_STYLES,
  type AlertFeedItem,
  type AlertSeverity,
  type DbNotification,
  type VitalFlagRow,
} from "../../../../lib/doctorAlerts";
import { toast } from "sonner";

const ICON_MAP: Record<string, typeof Bell> = {
  appointment: Calendar,
  lab: FileText,
  message: MessageSquare,
  prescription: Pill,
  security: ShieldCheck,
  video_consult: Video,
  clinical: Bell,
  Queue: ClipboardList,
  Vitals: HeartPulse,
  Messages: MessageSquare,
  Video: Video,
};

type FeedFilter = "all" | "unread" | "critical" | "notifications" | "clinical";

export function DoctorNotificationsPage() {
  const navigate = useNavigate();
  const doctorBase = useDoctorPortalBase();
  const { user } = useAuthStore();
  const { orders, fetchOrders, unreadMessagesCount, fetchUnreadMessages } = usePatientStore();
  const [dbNotifications, setDbNotifications] = useState<DbNotification[]>([]);
  const [flaggedVitals, setFlaggedVitals] = useState<VitalFlagRow[]>([]);
  const [dismissedClinical, setDismissedClinical] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [vitalsTableMissing, setVitalsTableMissing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const [notifRes, vitalsRes] = await Promise.all([
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("vital_readings")
          .select("id, patient_id, patient_name, metric, value, unit, recorded_at")
          .eq("flagged", true)
          .order("recorded_at", { ascending: false })
          .limit(25),
      ]);

      if (notifRes.error) {
        console.warn("[Alerts] notifications:", notifRes.error.message);
        setDbNotifications([]);
      } else {
        setDbNotifications((notifRes.data || []) as DbNotification[]);
      }

      if (vitalsRes.error) {
        if (isMissingTableError(vitalsRes.error)) setVitalsTableMissing(true);
        setFlaggedVitals([]);
      } else {
        setVitalsTableMissing(false);
        setFlaggedVitals((vitalsRes.data || []) as VitalFlagRow[]);
      }

      await fetchOrders();
      await fetchUnreadMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, fetchOrders, fetchUnreadMessages]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("doctor-alerts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "vital_readings" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAll]);

  const clinicalAlerts = useMemo(
    () =>
      buildClinicalAlerts(orders, flaggedVitals, unreadMessagesCount, doctorBase).filter(
        (a) => !dismissedClinical.has(a.id),
      ),
    [orders, flaggedVitals, unreadMessagesCount, doctorBase, dismissedClinical],
  );

  const feed = useMemo(
    () => mergeAlertFeed(dbNotifications, clinicalAlerts, doctorBase),
    [dbNotifications, clinicalAlerts, doctorBase],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return feed.filter((item) => {
      if (filter === "unread" && !item.unread) return false;
      if (filter === "critical" && item.severity !== "critical") return false;
      if (filter === "notifications" && item.source !== "notification") return false;
      if (filter === "clinical" && item.source !== "clinical") return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [feed, search, filter]);

  const stats = useMemo(() => {
    const unread = feed.filter((f) => f.unread).length;
    const critical = feed.filter((f) => f.severity === "critical").length;
    const clinical = clinicalAlerts.length;
    const inbox = dbNotifications.filter((n) => n.unread).length;
    return { total: feed.length, unread, critical, clinical, inbox };
  }, [feed, clinicalAlerts, dbNotifications]);

  const markAllDbRead = async () => {
    if (!user) return;
    try {
      await supabase.from("notifications").update({ unread: false }).eq("user_id", user.id).eq("unread", true);
      setDbNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      toast.success("Inbox notifications marked read.");
    } catch (err) {
      console.error(err);
      toast.error("Could not update notifications.");
    }
  };

  const markOneRead = async (item: AlertFeedItem) => {
    if (item.notificationId) {
      await supabase.from("notifications").update({ unread: false }).eq("id", item.notificationId);
      setDbNotifications((prev) =>
        prev.map((n) => (n.id === item.notificationId ? { ...n, unread: false } : n)),
      );
    } else {
      setDismissedClinical((prev) => new Set(prev).add(item.id));
    }
  };

  const handleOpen = async (item: AlertFeedItem) => {
    if (item.unread) await markOneRead(item);
    navigate(item.actionTo);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 mt-3">Syncing alerts…</p>
      </div>
    );
  }

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Coordination center"
        title="Alerts & Notifications"
        description="Unified inbox: system notifications plus live clinical signals from queue, vitals, and secure messaging — prioritized for rapid response."
      >
        <Button
          variant="outline"
          className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20"
          onClick={fetchAll}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
        <Button
          className="rounded-xl bg-[#D4AF37]/90 text-[#0A2E1F] hover:bg-[#D4AF37] font-bold"
          onClick={markAllDbRead}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark inbox read
        </Button>
      </DoctorPageHeader>

      {vitalsTableMissing && (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardContent className="p-4 text-sm text-amber-950">
            Vital alerts require <code className="font-mono text-xs bg-white px-1 rounded">vital_readings</code>. Run the vitals SQL backfill script in Supabase to enable RPM critical flags here.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active alerts", value: stats.total, icon: Bell },
          { label: "Unread", value: stats.unread, icon: Inbox },
          { label: "Critical", value: stats.critical, icon: AlertTriangle },
          { label: "Clinical signals", value: stats.clinical, icon: HeartPulse },
        ].map((s) => (
          <Card key={s.label} className={doctorSurfaceCard}>
            <CardContent className="flex items-center gap-4 p-5">
              <s.icon className="h-6 w-6 text-emerald-700 shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts…"
            className="pl-9 rounded-xl"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "All" },
              { id: "unread", label: "Unread" },
              { id: "critical", label: "Critical" },
              { id: "notifications", label: "Inbox" },
              { id: "clinical", label: "Clinical" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-black uppercase border inline-flex items-center gap-1",
                filter === f.id
                  ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                  : "bg-white text-slate-600 border-slate-200",
              )}
            >
              <Filter className="h-3 w-3 opacity-50" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card className={doctorSurfaceCard}>
            <CardContent className="py-20 text-center">
              <Bell className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
              <p className="font-bold text-[#0A2E1F]">All clear</p>
              <p className="text-sm text-slate-500 mt-1">No alerts match your filters right now.</p>
              <Link
                to={`${doctorBase}/queue`}
                className="inline-flex mt-4 text-sm font-bold text-emerald-700 hover:underline"
              >
                Open clinical queue
              </Link>
            </CardContent>
          </Card>
        ) : (
          filtered.map((item) => (
            <AlertCard key={item.id} item={item} onOpen={() => handleOpen(item)} onDismiss={() => markOneRead(item)} />
          ))
        )}
      </div>

      <Card className={cn(doctorSurfaceCard, "border-dashed")}>
        <CardContent className="p-5 flex flex-wrap gap-3">
          <p className="text-[10px] font-black uppercase text-slate-500 w-full mb-1">Quick links</p>
          {[
            { to: `${doctorBase}/queue`, label: "Clinical queue", icon: ClipboardList },
            { to: `${doctorBase}/vitals`, label: "Vitals", icon: HeartPulse },
            { to: `${doctorBase}/messages`, label: "Messages", icon: MessageSquare },
            { to: `${doctorBase}/rpm`, label: "RPM", icon: HeartPulse },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0A2E1F] hover:border-emerald-300"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AlertCard({
  item,
  onOpen,
  onDismiss,
}: {
  item: AlertFeedItem;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const sev = SEVERITY_STYLES[item.severity];
  const catKey = item.category.toLowerCase();
  const typeStyle = NOTIFICATION_TYPE_STYLES[catKey] || NOTIFICATION_TYPE_STYLES.clinical;
  const Icon = ICON_MAP[item.category] || ICON_MAP[catKey] || Bell;

  return (
    <Card
      className={cn(
        doctorSurfaceCard,
        "overflow-hidden transition-shadow hover:shadow-md cursor-pointer",
        item.unread && sev.border,
        item.unread && "ring-1 ring-emerald-100",
      )}
      onClick={onOpen}
    >
      <CardContent className="p-0">
        <div className="flex">
          {item.unread && <div className={cn("w-1.5 shrink-0", sev.dot.replace("animate-pulse", ""))} />}
          <div className="flex flex-1 gap-4 p-5">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border", typeStyle.badge)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge className={cn("text-[9px] font-black uppercase border", sev.badge)}>{item.severity}</Badge>
                <Badge className={cn("text-[9px] font-black uppercase border", typeStyle.badge)}>{item.category}</Badge>
                {item.source === "clinical" && (
                  <Badge className="text-[9px] font-bold bg-slate-100 text-slate-600 border-slate-200">Live</Badge>
                )}
                <span className="text-[10px] text-slate-400 ml-auto shrink-0">{formatAlertTime(item.createdAt)}</span>
              </div>
              <h4 className="font-black text-[#0A2E1F] text-sm">{item.title}</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed line-clamp-2">{item.body}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-bold text-emerald-800 inline-flex items-center gap-1">
                  {item.actionLabel}
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
                {item.unread && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss();
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 uppercase"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
