import { useEffect, useMemo, useState } from "react";
import { HeartPulse, Activity, AlertCircle, Watch, Smartphone, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared.tsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../../../lib/supabaseClient";
import { isMissingTableError } from "../../../../lib/supabaseTableError";

type Reading = {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  metric: string;
  value: number;
  unit: string | null;
  flagged: boolean | null;
  recorded_at: string;
};

const METRIC_LABEL: Record<string, string> = {
  bp_sys: "Systolic", bp_dia: "Diastolic", hr: "Heart Rate", spo2: "SpO₂", glucose: "Glucose", weight: "Weight",
};

export function DoctorRPMPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [patients, setPatients] = useState<{ patient_id: string; patient_name: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);

  async function fetchReadings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vital_readings')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(500);
      if (error) {
        if (isMissingTableError(error)) { setMissingTable(true); setReadings([]); return; }
        throw error;
      }
      setReadings(data || []);

      // Build distinct patient list from the readings
      const seen = new Map<string, string>();
      (data || []).forEach((r: Reading) => {
        if (r.patient_id && r.patient_name && !seen.has(r.patient_id)) seen.set(r.patient_id, r.patient_name);
      });
      const list = Array.from(seen.entries()).map(([patient_id, patient_name]) => ({ patient_id, patient_name }));
      setPatients(list);
      if (!selected && list.length) setSelected(list[0].patient_id);
    } catch (err) {
      console.error("RPM fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReadings();
    const ch = supabase.channel('rpm-vitals-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vital_readings' }, fetchReadings)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => {
    const since24h = Date.now() - 24 * 60 * 60 * 1000;
    const recent = readings.filter(r => new Date(r.recorded_at).getTime() > since24h);
    const activeDevices = new Set(recent.map(r => r.patient_id).filter(Boolean)).size;
    const criticalAlerts = recent.filter(r => r.flagged).length;
    const totalPatients = patients.length;
    const stablePct = totalPatients ? Math.round(((totalPatients - new Set(recent.filter(r => r.flagged).map(r => r.patient_id)).size) / totalPatients) * 100) : 100;
    return { activeDevices, criticalAlerts, stablePct, syncs: recent.length };
  }, [readings, patients]);

  const selectedSeries = useMemo(() => {
    if (!selected) return [];
    const slice = readings.filter(r => r.patient_id === selected && (r.metric === 'bp_sys' || r.metric === 'bp_dia')).slice().reverse();
    const buckets: Record<string, { time: string; sys?: number; dia?: number }> = {};
    for (const r of slice) {
      const t = new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      buckets[t] ||= { time: t };
      if (r.metric === 'bp_sys') buckets[t].sys = Number(r.value);
      else buckets[t].dia = Number(r.value);
    }
    return Object.values(buckets).slice(-12);
  }, [readings, selected]);

  const criticalQueue = useMemo(() => readings.filter(r => r.flagged).slice(0, 6), [readings]);
  const selectedPatientName = patients.find(p => p.patient_id === selected)?.patient_name;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-red-500" /> Remote Patient Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">Live telemetry and vital signs from patient devices.</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={fetchReadings}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {missingTable && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            <p className="font-bold mb-1">RPM table not yet provisioned.</p>
            <p>Apply <code className="font-mono bg-white px-2 py-0.5 rounded">supabase_vital_readings.sql</code> in your database SQL editor to enable live device telemetry.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { title: "Active Devices (24h)", value: stats.activeDevices, icon: Watch, color: "text-violet-500" },
          { title: "Critical Alerts", value: stats.criticalAlerts, icon: AlertCircle, color: "text-red-500" },
          { title: "Stable Patients", value: `${stats.stablePct}%`, icon: Activity, color: "text-emerald-500" },
          { title: "Syncs (24h)", value: stats.syncs, icon: Smartphone, color: "text-purple-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              {selectedPatientName ? `Live Telemetry: ${selectedPatientName}` : "Live Telemetry"}
            </CardTitle>
            {patients.length > 0 && (
              <select
                value={selected || ""}
                onChange={e => setSelected(e.target.value || null)}
                className="text-xs border border-border rounded-lg px-2 py-1 bg-background"
              >
                {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.patient_name}</option>)}
              </select>
            )}
          </CardHeader>
          <CardContent>
            {selectedSeries.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground text-sm">
                <HeartPulse className="h-8 w-8 mb-3 opacity-30" />
                No blood pressure readings yet for this patient.
              </div>
            ) : (
              <div className="h-[250px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedSeries}>
                    <defs>
                      <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--background)" }} />
                    <Area type="monotone" dataKey="sys" name="Systolic" stroke="#ef4444" fillOpacity={1} fill="url(#colorSys)" strokeWidth={2} />
                    <Area type="monotone" dataKey="dia" name="Diastolic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDia)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Critical Alerts Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {criticalQueue.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                <Activity className="h-7 w-7 mx-auto mb-3 opacity-30" />
                No critical alerts.
              </div>
            ) : (
              <div className="space-y-4">
                {criticalQueue.map(r => {
                  const ago = Math.max(1, Math.round((Date.now() - new Date(r.recorded_at).getTime()) / 60000));
                  return (
                    <div key={r.id} className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-red-900 dark:text-red-200">{r.patient_name || "Unknown patient"}</p>
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400">{METRIC_LABEL[r.metric] || r.metric} flagged</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{ago < 60 ? `${ago} min ago` : `${Math.round(ago/60)} hr ago`}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400">{r.value}{r.unit ? ` ${r.unit}` : ''}</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-white dark:bg-background"
                          onClick={() => r.patient_id && setSelected(r.patient_id)}>
                          Review
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
