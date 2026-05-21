import { useState, useEffect, useMemo } from "react";
import { Plus, HeartPulse, Loader2, Activity, Wind, Thermometer, Scale, Droplets, Radio, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../../../../lib/auth-store";
import { supabase } from "../../../../lib/supabaseClient";
import {
  buildVitalCards,
  STATUS_STYLES,
  SOURCE_LABEL,
  readingStatus,
  parseIntakeVitals,
  type VitalReading,
  type VitalCardModel,
  type IntakeVitals,
} from "../../../../lib/vitalsClinical";
import { toast } from "sonner";

const CARD_ICONS: Record<string, typeof Heart> = {
  bp: Heart,
  hr: Activity,
  spo2: Wind,
  temp: Thermometer,
  weight: Scale,
  glucose: Droplets,
  resp: Radio,
};

function VitalMetricCard({ card }: { card: VitalCardModel }) {
  const Icon = CARD_ICONS[card.id] ?? HeartPulse;
  const styles = STATUS_STYLES[card.status] || STATUS_STYLES.unknown;
  const hasTrend = card.sparkline && card.sparkline.length > 1;

  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md ring-1 bg-white", styles.ring)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 border-b border-emerald-100/60 bg-gradient-to-br from-white to-emerald-50/30 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A2E1F] text-emerald-100 shadow-lg shadow-emerald-950/20">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
              <p className="text-xl font-black tracking-tight text-[#0A2E1F] truncate">{card.current}</p>
            </div>
          </div>
          <Badge className={cn("shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase", styles.badge)}>
            <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", styles.dot)} />
            {card.statusLabel}
          </Badge>
        </div>
        <div className="px-5 py-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="truncate">{SOURCE_LABEL[card.source] || card.source}</span>
          <span>{card.recordedAt ? new Date(card.recordedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
        </div>
        {hasTrend && (
          <div className="h-[72px] px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={card.sparkline}>
                <defs>
                  <linearGradient id={`g-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#059669" strokeWidth={2} fill={`url(#g-${card.id})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PatientVitalsPage() {
  const { user } = useAuthStore();
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [intake, setIntake] = useState<IntakeVitals | null>(null);
  const [loading, setLoading] = useState(true);

  // Manual Entry State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logMetric, setLogMetric] = useState("bp");
  const [logVal1, setLogVal1] = useState("");
  const [logVal2, setLogVal2] = useState(""); // For Diastolic BP
  const [logSubmitting, setLogSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchVitals = async () => {
      try {
        const [readingsRes, ordersRes] = await Promise.all([
          supabase
            .from("vital_readings")
            .select("*")
            .eq("patient_id", user.id)
            .order("recorded_at", { ascending: false })
            .limit(100),
          supabase
            .from("orders")
            .select("patient_vitals")
            .eq("user_id", user.id)
            .not("patient_vitals", "is", null)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

        if (readingsRes.data) {
          setReadings(readingsRes.data as VitalReading[]);
        }
        if (ordersRes.data && ordersRes.data.length > 0) {
          setIntake(parseIntakeVitals(ordersRes.data[0].patient_vitals));
        }
      } catch (err) {
        console.error("Vitals fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVitals();

    const channel = supabase
      .channel("patient-vitals-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vital_readings", filter: `patient_id=eq.${user.id}` },
        () => {
          fetchVitals(); // Refresh on changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const vitalCards = useMemo(() => buildVitalCards(readings, intake), [readings, intake]);

  const handleLogVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setLogSubmitting(true);

    try {
      const now = new Date().toISOString();
      const patientName = `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim() || "Unknown";

      const rowsToInsert = [];

      if (logMetric === "bp") {
        const sys = Number(logVal1);
        const dia = Number(logVal2);
        if (!sys || !dia) throw new Error("Please provide both Systolic and Diastolic values.");
        
        rowsToInsert.push({
          patient_id: user.id,
          patient_name: patientName,
          metric: "bp_sys",
          value: sys,
          unit: "mmHg",
          source: "manual",
          flagged: readingStatus("bp_sys", sys) === "alert" || readingStatus("bp_sys", sys) === "high" || readingStatus("bp_sys", sys) === "low",
          recorded_at: now,
        });
        rowsToInsert.push({
          patient_id: user.id,
          patient_name: patientName,
          metric: "bp_dia",
          value: dia,
          unit: "mmHg",
          source: "manual",
          flagged: readingStatus("bp_dia", dia) === "alert" || readingStatus("bp_dia", dia) === "high" || readingStatus("bp_dia", dia) === "low",
          recorded_at: now,
        });
      } else {
        const val = Number(logVal1);
        if (!val) throw new Error("Please provide a valid number.");

        let unit = "";
        let metricKey = logMetric;
        switch (logMetric) {
          case "hr": unit = "bpm"; break;
          case "spo2": unit = "%"; break;
          case "temp": unit = "°F"; break;
          case "weight": unit = "lbs"; break;
          case "glucose": unit = "mg/dL"; break;
          case "resp_rate": unit = "/min"; break;
        }

        rowsToInsert.push({
          patient_id: user.id,
          patient_name: patientName,
          metric: metricKey,
          value: val,
          unit,
          source: "manual",
          flagged: readingStatus(metricKey, val) === "alert" || readingStatus(metricKey, val) === "high" || readingStatus(metricKey, val) === "low",
          recorded_at: now,
        });
      }

      const { error } = await supabase.from("vital_readings").insert(rowsToInsert);
      if (error) throw error;

      toast.success("Vital recorded successfully");
      setIsLogModalOpen(false);
      setLogVal1("");
      setLogVal2("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save reading");
    } finally {
      setLogSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2E1F]">My Vitals</h1>
          <p className="text-sm text-slate-500 mt-1">Track your health metrics. These readings are securely shared with your clinical team.</p>
        </div>
        <Button 
          className="rounded-xl bg-[#0A2E1F] hover:bg-[#0d3a28] shadow-md"
          onClick={() => setIsLogModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Reading
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vitalCards.map((card) => (
          <VitalMetricCard key={card.id} card={card} />
        ))}
      </div>

      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b bg-slate-50/50 rounded-t-xl">
              <CardTitle className="text-lg font-bold text-[#0A2E1F]">Log New Reading</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleLogVital} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Metric</label>
                  <select 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    value={logMetric}
                    onChange={(e) => {
                      setLogMetric(e.target.value);
                      setLogVal1("");
                      setLogVal2("");
                    }}
                  >
                    <option value="bp">Blood Pressure</option>
                    <option value="hr">Heart Rate</option>
                    <option value="spo2">Oxygen (SpO2)</option>
                    <option value="temp">Temperature</option>
                    <option value="glucose">Glucose</option>
                    <option value="weight">Weight</option>
                    <option value="resp_rate">Respiratory Rate</option>
                  </select>
                </div>

                {logMetric === "bp" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase">Systolic</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 120" 
                        value={logVal1} 
                        onChange={(e) => setLogVal1(e.target.value)} 
                        className="rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase">Diastolic</label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 80" 
                        value={logVal2} 
                        onChange={(e) => setLogVal2(e.target.value)} 
                        className="rounded-xl"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase">
                      Value ({logMetric === 'hr' ? 'bpm' : logMetric === 'spo2' ? '%' : logMetric === 'temp' ? '°F' : logMetric === 'weight' ? 'lbs' : logMetric === 'glucose' ? 'mg/dL' : '/min'})
                    </label>
                    <Input 
                      type="number" 
                      step="any"
                      placeholder={`e.g. ${logMetric === 'temp' ? '98.6' : '75'}`} 
                      value={logVal1} 
                      onChange={(e) => setLogVal1(e.target.value)} 
                      className="rounded-xl"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#0A2E1F] hover:bg-[#0d3a28]" disabled={logSubmitting}>
                    {logSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Reading
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
