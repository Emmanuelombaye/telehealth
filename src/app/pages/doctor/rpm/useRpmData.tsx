import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePrefersHover } from "./usePrefersHover";
import { supabase } from "../../../../lib/supabaseClient";
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import { type VitalReading } from "../../../../lib/vitalsClinical";
import { filterClinicalPatientOrders } from "../../../../lib/clinicalTestData";
import { buildRpmRoster, readingsForPatient, type RpmTimeRange } from "../../../../lib/doctorRpm";
import {
  buildAlertsEngine,
  buildDeviceFleet,
  buildLiveMonitoringRows,
  buildOrdersLookup,
  buildPatientTimeline,
  computeCommandStats,
  loadAcknowledgedAlerts,
  loadEscalatedPatients,
  saveAcknowledgedAlerts,
  saveEscalatedPatients,
  escalatePatient,
  sortLiveRows,
  type RpmAlert,
  type RpmLiveRow,
  type RpmOrderRow,
} from "../../../../lib/rpmCommandCenter";
import type { RpmTheme } from "../../../../lib/rpmEnterpriseUi";

const THEME_KEY = "peak_rpm_theme";

type RpmContextValue = {
  readings: VitalReading[];
  orders: RpmOrderRow[];
  ordersLookup: Map<string, RpmOrderRow>;
  roster: ReturnType<typeof buildRpmRoster>;
  stats: ReturnType<typeof computeCommandStats>;
  liveRows: RpmLiveRow[];
  allAlerts: RpmAlert[];
  deviceFleet: ReturnType<typeof buildDeviceFleet>;
  range: RpmTimeRange;
  setRange: (r: RpmTimeRange) => void;
  search: string;
  setSearch: (s: string) => void;
  theme: RpmTheme;
  setTheme: (t: RpmTheme) => void;
  loading: boolean;
  refreshing: boolean;
  missingTable: boolean;
  livePulse: boolean;
  fetchAll: () => Promise<void>;
  acked: Set<string>;
  acknowledgeAlert: (id: string) => void;
  escalated: Set<string>;
  escalatePatientKey: (key: string) => void;
  drawerKey: string | null;
  setDrawerKey: (k: string | null) => void;
  selectedPatientKey: string | null;
  selectPatient: (key: string) => void;
  drawerPinned: boolean;
  wallMode: boolean;
  setWallMode: (v: boolean) => void;
  filteredRows: RpmLiveRow[];
  visibleAlerts: RpmAlert[];
  getTimeline: (row: RpmLiveRow) => ReturnType<typeof buildPatientTimeline>;
  getPatientReadings: (row: RpmLiveRow) => VitalReading[];
  prefersHover: boolean;
  openPatientDrawer: (key: string) => void;
  openPatientDrawerHover: (key: string) => void;
  schedulePatientDrawerClose: () => void;
  cancelPatientDrawerClose: () => void;
  closePatientDrawer: () => void;
};

const RpmContext = createContext<RpmContextValue | null>(null);

export function RpmProvider({ children }: { children: ReactNode }) {
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [orders, setOrders] = useState<RpmOrderRow[]>([]);
  const [range, setRange] = useState<RpmTimeRange>("24h");
  const [search, setSearch] = useState("");
  const [theme, setThemeState] = useState<RpmTheme>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as RpmTheme) || "light";
    } catch {
      return "light";
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [livePulse, setLivePulse] = useState(false);
  const [acked, setAcked] = useState<Set<string>>(() => loadAcknowledgedAlerts());
  const [escalated, setEscalated] = useState<Set<string>>(() => loadEscalatedPatients());
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  const [selectedPatientKey, setSelectedPatientKey] = useState<string | null>(null);
  const [drawerPinned, setDrawerPinned] = useState(false);
  const [wallMode, setWallMode] = useState(false);

  const selectPatient = useCallback((key: string) => {
    setSelectedPatientKey(key);
  }, []);
  const prefersHover = usePrefersHover();
  const drawerCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPatientDrawerClose = useCallback(() => {
    if (drawerCloseTimer.current) {
      clearTimeout(drawerCloseTimer.current);
      drawerCloseTimer.current = null;
    }
  }, []);

  const schedulePatientDrawerClose = useCallback(() => {
    if (!prefersHover) return;
    cancelPatientDrawerClose();
    drawerCloseTimer.current = setTimeout(() => {
      setDrawerKey(null);
      setDrawerPinned(false);
    }, 380);
  }, [prefersHover, cancelPatientDrawerClose]);

  const openPatientDrawer = useCallback(
    (key: string) => {
      cancelPatientDrawerClose();
      setSelectedPatientKey(key);
      setDrawerPinned(true);
      setDrawerKey(key);
    },
    [cancelPatientDrawerClose],
  );

  const openPatientDrawerHover = useCallback(
    (key: string) => {
      if (!prefersHover) return;
      cancelPatientDrawerClose();
      setDrawerPinned(false);
      setDrawerKey(key);
    },
    [prefersHover, cancelPatientDrawerClose],
  );

  const closePatientDrawer = useCallback(() => {
    cancelPatientDrawerClose();
    setDrawerKey(null);
    setDrawerPinned(false);
    // Keep selectedPatientKey so inline charts stay visible
  }, [cancelPatientDrawerClose]);

  const setTheme = (t: RpmTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
  };

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [readingsRes, ordersRes] = await Promise.all([
        supabase.from("vital_readings").select("*").order("recorded_at", { ascending: false }).limit(1200),
        supabase
          .from("orders")
          .select("id, user_id, patient_name, patient_vitals, medication, category, intake_answers, zoom_status, status")
          .order("created_at", { ascending: false })
          .limit(400),
      ]);

      if (readingsRes.error) {
        if (isMissingTableError(readingsRes.error)) {
          setMissingTable(true);
          setReadings([]);
        } else {
          console.warn("[RPM]", readingsRes.error.message);
        }
      } else {
        setMissingTable(false);
        setReadings((readingsRes.data || []) as VitalReading[]);
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1400);
      }

      if (!ordersRes.error) {
        const rows = filterClinicalPatientOrders(ordersRes.data || []);
        setOrders(
          rows.map((o) => ({
            id: o.id,
            user_id: o.user_id,
            patient_name: o.patient_name,
            patient_vitals: o.patient_vitals,
            medication: (o as { medication?: string }).medication,
            category: (o as { category?: string }).category,
            intake_answers: (o as { intake_answers?: Record<string, unknown> }).intake_answers,
            zoom_status: (o as { zoom_status?: string }).zoom_status,
            status: (o as { status?: string }).status,
          })),
        );
      }
    } catch (err) {
      console.error("[RPM]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (missingTable) return;
    const ch = supabase
      .channel("rpm-enterprise-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "vital_readings" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchAll, missingTable]);

  const ordersLookup = useMemo(() => buildOrdersLookup(orders), [orders]);
  const roster = useMemo(() => buildRpmRoster(readings, orders, range), [readings, orders, range]);
  const stats = useMemo(() => computeCommandStats(roster, readings, orders, range), [roster, readings, orders, range]);
  const liveRows = useMemo(
    () => buildLiveMonitoringRows(roster, readings, range, ordersLookup, escalated),
    [roster, readings, range, ordersLookup, escalated],
  );
  const allAlerts = useMemo(() => buildAlertsEngine(roster, readings, range), [roster, readings, range]);
  const deviceFleet = useMemo(() => buildDeviceFleet(readings, range), [readings, range]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = liveRows;
    if (q) rows = rows.filter((r) => r.patient.patient_name.toLowerCase().includes(q));
    return sortLiveRows(rows, "severity", "desc");
  }, [liveRows, search]);

  const visibleAlerts = useMemo(
    () => allAlerts.filter((a) => !acked.has(a.id)),
    [allAlerts, acked],
  );

  const acknowledgeAlert = (id: string) => {
    setAcked((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveAcknowledgedAlerts(next);
      return next;
    });
  };

  const escalatePatientKey = (key: string) => {
    escalatePatient(key);
    setEscalated(loadEscalatedPatients());
  };

  const getPatientReadings = (row: RpmLiveRow) => readingsForPatient(readings, row.patient, range);
  const getTimeline = (row: RpmLiveRow) => buildPatientTimeline(row.patient, getPatientReadings(row), allAlerts);

  const value: RpmContextValue = {
    readings,
    orders,
    ordersLookup,
    roster,
    stats,
    liveRows,
    allAlerts,
    deviceFleet,
    range,
    setRange,
    search,
    setSearch,
    theme,
    setTheme,
    loading,
    refreshing,
    missingTable,
    livePulse,
    fetchAll,
    acked,
    acknowledgeAlert,
    escalated,
    escalatePatientKey,
    drawerKey,
    setDrawerKey,
    selectedPatientKey,
    selectPatient,
    drawerPinned,
    closePatientDrawer,
    wallMode,
    setWallMode,
    filteredRows,
    visibleAlerts,
    getTimeline,
    getPatientReadings,
    prefersHover,
    openPatientDrawer,
    openPatientDrawerHover,
    schedulePatientDrawerClose,
    cancelPatientDrawerClose,
  };

  return <RpmContext.Provider value={value}>{children}</RpmContext.Provider>;
}

export function useRpmData(): RpmContextValue {
  const ctx = useContext(RpmContext);
  if (!ctx) throw new Error("useRpmData must be used within RpmProvider");
  return ctx;
}
