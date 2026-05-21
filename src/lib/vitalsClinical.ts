/**
 * Clinical vitals helpers — thresholds, status labels, and series shaping.
 * Reads from `vital_readings` metrics; intake baseline from `orders.patient_vitals`.
 */

import { parsePatientVitals } from "./patientVitals";

export type VitalStatus = "normal" | "elevated" | "high" | "low" | "alert" | "unknown";

export type VitalReading = {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  metric: string;
  value: number;
  unit: string | null;
  source: string | null;
  flagged: boolean | null;
  recorded_at: string;
};

export type IntakeVitals = {
  height?: string;
  weight?: string;
  bmi?: string | number;
  sex?: string;
  dob?: string;
  allergies?: string;
  currentMeds?: string;
  bp_sys?: number;
  bp_dia?: number;
  hr?: number;
  spo2?: number;
  temp_f?: number;
  glucose?: number;
  resp_rate?: number;
  captured_at?: string;
};

export type VitalCardModel = {
  id: string;
  label: string;
  current: string;
  status: VitalStatus;
  statusLabel: string;
  source: string;
  recordedAt: string | null;
  sparkline?: { t: string; v: number }[];
};

const STATUS_LABEL: Record<VitalStatus, string> = {
  normal: "Normal",
  elevated: "Elevated",
  high: "High",
  low: "Low",
  alert: "Alert",
  unknown: "No data",
};

export function statusLabel(s: VitalStatus): string {
  return STATUS_LABEL[s];
}

export function parseIntakeVitals(raw: unknown): IntakeVitals | null {
  return parsePatientVitals(raw);
}

export function readingStatus(metric: string, value: number, flagged?: boolean | null): VitalStatus {
  if (flagged) return "alert";
  switch (metric) {
    case "bp_sys":
      if (value >= 140) return "high";
      if (value >= 120) return "elevated";
      if (value < 90) return "low";
      return "normal";
    case "bp_dia":
      if (value >= 90) return "high";
      if (value >= 80) return "elevated";
      if (value < 60) return "low";
      return "normal";
    case "hr":
      if (value < 50 || value > 100) return "alert";
      if (value < 60 || value > 90) return "elevated";
      return "normal";
    case "spo2":
      if (value < 92) return "alert";
      if (value < 95) return "elevated";
      return "normal";
    case "glucose":
      if (value > 125) return "high";
      if (value < 70) return "low";
      return "normal";
    case "weight":
      return "normal";
    case "temp":
      if (value >= 100.4) return "high";
      if (value >= 99.5) return "elevated";
      if (value < 97) return "low";
      return "normal";
    case "resp_rate":
    case "rr":
      if (value < 12 || value > 20) return "alert";
      return "normal";
    default:
      return flagged ? "alert" : "normal";
  }
}

export function worstStatus(a: VitalStatus, b: VitalStatus): VitalStatus {
  const rank: Record<VitalStatus, number> = {
    unknown: 0,
    normal: 1,
    elevated: 2,
    low: 3,
    high: 4,
    alert: 5,
  };
  return rank[a] >= rank[b] ? a : b;
}

export function latestReading(
  readings: VitalReading[],
  metrics: string[],
): VitalReading | null {
  const filtered = readings
    .filter((r) => metrics.includes(r.metric))
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  return filtered[0] ?? null;
}

export function trendSeries(
  readings: VitalReading[],
  metric: string,
  limit = 14,
): { t: string; v: number }[] {
  return readings
    .filter((r) => r.metric === metric)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-limit)
    .map((r) => ({
      t: new Date(r.recorded_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      v: Number(r.value),
    }));
}

export function buildVitalCards(
  readings: VitalReading[],
  intake: IntakeVitals | null,
): VitalCardModel[] {
  const sys = latestReading(readings, ["bp_sys"]);
  const dia = latestReading(readings, ["bp_dia"]);
  const hr = latestReading(readings, ["hr"]);
  const spo2 = latestReading(readings, ["spo2"]);
  const temp = latestReading(readings, ["temp", "temperature"]);
  const weight = latestReading(readings, ["weight"]);
  const glucose = latestReading(readings, ["glucose"]);
  const resp = latestReading(readings, ["resp_rate", "rr"]);

  const bpStatus =
    sys && dia
      ? worstStatus(
          readingStatus("bp_sys", Number(sys.value), sys.flagged),
          readingStatus("bp_dia", Number(dia.value), dia.flagged),
        )
      : "unknown";

  const iSys = intake?.bp_sys;
  const iDia = intake?.bp_dia;
  const intakeBpStatus =
    iSys != null && iDia != null
      ? worstStatus(readingStatus("bp_sys", iSys), readingStatus("bp_dia", iDia))
      : "unknown";

  const cards: VitalCardModel[] = [
    {
      id: "bp",
      label: "Blood Pressure",
      current: sys && dia ? `${sys.value}/${dia.value} mmHg` : iSys != null && iDia != null ? `${iSys}/${iDia} mmHg` : "—",
      status: sys && dia ? bpStatus : intakeBpStatus,
      statusLabel: sys && dia ? statusLabel(bpStatus) : iSys != null && iDia != null ? `${statusLabel(intakeBpStatus)} (intake)` : "No data",
      source: sys?.source || dia?.source || (intake ? "enrollment intake" : "—"),
      recordedAt: sys?.recorded_at || dia?.recorded_at || intake?.captured_at || null,
      sparkline: trendSeries(readings, "bp_sys", 10),
    },
    {
      id: "hr",
      label: "Heart Rate",
      current: hr ? `${hr.value} bpm` : intake?.hr != null ? `${intake.hr} bpm` : "—",
      status: hr ? readingStatus("hr", Number(hr.value), hr.flagged) : intake?.hr != null ? readingStatus("hr", intake.hr) : "unknown",
      statusLabel: hr
        ? statusLabel(readingStatus("hr", Number(hr.value), hr.flagged))
        : intake?.hr != null
          ? `${statusLabel(readingStatus("hr", intake.hr))} (intake)`
          : "No data",
      source: hr?.source || (intake?.hr != null ? "enrollment intake" : "—"),
      recordedAt: hr?.recorded_at || intake?.captured_at || null,
      sparkline: trendSeries(readings, "hr", 10),
    },
    {
      id: "spo2",
      label: "Oxygen (SpO₂)",
      current: spo2 ? `${spo2.value}%` : intake?.spo2 != null ? `${intake.spo2}%` : "—",
      status: spo2 ? readingStatus("spo2", Number(spo2.value), spo2.flagged) : intake?.spo2 != null ? readingStatus("spo2", intake.spo2) : "unknown",
      statusLabel: spo2
        ? statusLabel(readingStatus("spo2", Number(spo2.value), spo2.flagged))
        : intake?.spo2 != null
          ? `${statusLabel(readingStatus("spo2", intake.spo2))} (intake)`
          : "No data",
      source: spo2?.source || (intake?.spo2 != null ? "enrollment intake" : "—"),
      recordedAt: spo2?.recorded_at || intake?.captured_at || null,
      sparkline: trendSeries(readings, "spo2", 10),
    },
    {
      id: "temp",
      label: "Temperature",
      current: temp ? `${temp.value}°F` : intake?.temp_f != null ? `${intake.temp_f}°F` : "—",
      status: temp ? readingStatus("temp", Number(temp.value), temp.flagged) : intake?.temp_f != null ? readingStatus("temp", intake.temp_f) : "unknown",
      statusLabel: temp
        ? statusLabel(readingStatus("temp", Number(temp.value), temp.flagged))
        : intake?.temp_f != null
          ? `${statusLabel(readingStatus("temp", intake.temp_f))} (intake)`
          : "No data",
      source: temp?.source || (intake?.temp_f != null ? "enrollment intake" : "—"),
      recordedAt: temp?.recorded_at || intake?.captured_at || null,
      sparkline: trendSeries(readings, temp?.metric || "temp", 10),
    },
    {
      id: "weight",
      label: "Weight / BMI",
      current: weight
        ? `${weight.value} ${weight.unit || "lbs"}`
        : intake?.weight
          ? intake.weight
          : intake?.bmi
            ? `BMI ${intake.bmi}`
            : "—",
      status: weight ? readingStatus("weight", Number(weight.value), weight.flagged) : intake?.bmi ? "normal" : "unknown",
      statusLabel: weight || intake?.weight || intake?.bmi ? (weight ? statusLabel(readingStatus("weight", Number(weight.value), weight.flagged)) : "Intake baseline") : "No data",
      source: weight?.source || (intake ? "enrollment intake" : "—"),
      recordedAt: weight?.recorded_at || null,
      sparkline: trendSeries(readings, "weight", 10),
    },
    {
      id: "glucose",
      label: "Blood Glucose",
      current: glucose ? `${glucose.value} ${glucose.unit || "mg/dL"}` : intake?.glucose != null ? `${intake.glucose} mg/dL` : "—",
      status: glucose
        ? readingStatus("glucose", Number(glucose.value), glucose.flagged)
        : intake?.glucose != null
          ? readingStatus("glucose", intake.glucose)
          : "unknown",
      statusLabel: glucose
        ? statusLabel(readingStatus("glucose", Number(glucose.value), glucose.flagged))
        : intake?.glucose != null
          ? `${statusLabel(readingStatus("glucose", intake.glucose))} (intake)`
          : "No data",
      source: glucose?.source || (intake?.glucose != null ? "enrollment intake" : "—"),
      recordedAt: glucose?.recorded_at || intake?.captured_at || null,
      sparkline: trendSeries(readings, "glucose", 10),
    },
    {
      id: "resp",
      label: "Respiratory Rate",
      current: resp ? `${resp.value} /min` : intake?.resp_rate != null ? `${intake.resp_rate} /min` : "—",
      status: resp
        ? readingStatus(resp.metric, Number(resp.value), resp.flagged)
        : intake?.resp_rate != null
          ? readingStatus("resp_rate", intake.resp_rate)
          : "unknown",
      statusLabel: resp
        ? statusLabel(readingStatus(resp.metric, Number(resp.value), resp.flagged))
        : intake?.resp_rate != null
          ? `${statusLabel(readingStatus("resp_rate", intake.resp_rate))} (intake)`
          : "No data",
      source: resp?.source || (intake?.resp_rate != null ? "enrollment intake" : "—"),
      recordedAt: resp?.recorded_at || intake?.captured_at || null,
      sparkline: trendSeries(readings, resp?.metric || "resp_rate", 10),
    },
  ];

  if (intake?.height && cards.find((c) => c.id === "weight")?.current === intake.weight) {
    const w = cards.find((c) => c.id === "weight");
    if (w && intake.bmi) w.current = `${intake.weight} · BMI ${intake.bmi}`;
  }

  return cards;
}

export const STATUS_STYLES: Record<VitalStatus, { badge: string; ring: string; dot: string }> = {
  normal: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    ring: "ring-emerald-200/80",
    dot: "bg-emerald-500",
  },
  elevated: {
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    ring: "ring-amber-200/80",
    dot: "bg-amber-500",
  },
  high: {
    badge: "bg-orange-50 text-orange-900 border-orange-200",
    ring: "ring-orange-200/80",
    dot: "bg-orange-500",
  },
  low: {
    badge: "bg-sky-50 text-sky-900 border-sky-200",
    ring: "ring-sky-200/80",
    dot: "bg-sky-500",
  },
  alert: {
    badge: "bg-red-50 text-red-900 border-red-200",
    ring: "ring-red-300/90",
    dot: "bg-red-500 animate-pulse",
  },
  unknown: {
    badge: "bg-slate-50 text-slate-600 border-slate-200",
    ring: "ring-slate-200/80",
    dot: "bg-slate-300",
  },
};

export const SOURCE_LABEL: Record<string, string> = {
  apple_health: "Apple Health",
  fitbit: "Fitbit",
  cuff: "BP Cuff",
  manual: "Manual entry",
  enrollment: "Enrollment intake",
  enrollment_intake: "Enrollment intake",
};
