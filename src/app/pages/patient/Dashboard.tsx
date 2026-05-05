import { Link } from "react-router";
import {
  Calendar, Clock, FileText, Activity, MessageSquare, Plus,
  ArrowRight, Droplets, Heart, ChevronRight, Video, Pill,
  ShieldCheck, TrendingUp, Bell, Truck, Stethoscope, CheckCircle2, Package
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, cn } from "../../components/ui/shared";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  useI18n, getGreeting,
  ORDER_STEPS, getActiveOrder, getStepIndex, doctorAvailability,
} from "../../../lib";

const stepIcon: Record<string, any> = {
  intake_submitted: CheckCircle2,
  doctor_review: Stethoscope,
  prescribed: Pill,
  pharmacy: Package,
  shipped: Truck,
  delivered: CheckCircle2,
};

const healthData = [
  { day: "Mon", bpm: 72 }, { day: "Tue", bpm: 75 }, { day: "Wed", bpm: 68 },
  { day: "Thu", bpm: 74 }, { day: "Fri", bpm: 70 }, { day: "Sat", bpm: 65 }, { day: "Sun", bpm: 69 },
];

export function PatientDashboard() {
  const { t } = useI18n();
  const greeting = getGreeting(t);
  const activeOrder = getActiveOrder();
  const activeIdx = getStepIndex(activeOrder.status);
  const activeProgress = Math.round(((activeIdx + 1) / ORDER_STEPS.length) * 100);
  const availableDoctors = doctorAvailability.filter(d => d.available);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-xl font-bold">Alex Sterling 👋</h1>
        </div>
        <Link to="/patient/appointments">
          <Button className="rounded-full h-10 px-4 shadow-md shadow-primary/20 text-sm gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("action.bookVisit")}</span>
          </Button>
        </Link>
      </div>

      {/* Alert banner */}
      <div className="flex items-center gap-3 bg-accent/30 border border-accent rounded-2xl px-4 py-3">
        <Bell className="h-4 w-4 text-[var(--brand-peach-900)] shrink-0" />
        <p className="text-sm text-[var(--brand-peach-900)] font-medium">
          Lab results from May 12 are ready. <Link to="/patient/labs" className="underline">View now</Link>
        </p>
      </div>

      {/* Active Treatment Status — pipeline */}
      <Link to="/patient/orders" className="block">
        <Card className="border-l-4 border-l-primary overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Active Treatment</p>
                <p className="font-bold text-sm truncate">{activeOrder.product}</p>
                <p className="text-xs text-muted-foreground">{activeOrder.id} · {activeOrder.doctor}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">
                {ORDER_STEPS[activeIdx].label}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {ORDER_STEPS.map((step, i) => {
                const Icon = stepIcon[step.key];
                const done = i <= activeIdx;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                    <div className={cn("h-7 w-7 rounded-full flex items-center justify-center transition-all",
                      done ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {i < ORDER_STEPS.length - 1 && (
                      <div className={cn("h-0.5 w-full -mt-4 -z-10", done && i < activeIdx ? "bg-primary" : "bg-border")} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{ORDER_STEPS[activeIdx].desc}</p>
              <span className="text-[10px] font-bold text-primary">{activeProgress}%</span>
            </div>
            {activeOrder.tracking && (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border text-xs">
                <Truck className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Tracking:</span>
                <span className="font-mono font-semibold">{activeOrder.tracking}</span>
                {activeOrder.estimatedDelivery && (
                  <span className="ml-auto text-muted-foreground">ETA {activeOrder.estimatedDelivery}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Doctor Availability strip */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">Doctors available now</h2>
          <Link to="/patient/appointments" className="text-xs text-primary font-semibold">{t("action.viewAll")}</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {availableDoctors.map(doc => (
            <Link key={doc.id} to="/patient/appointments" className="shrink-0">
              <div className="w-40 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="relative h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                    {doc.avatar}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--brand-sage-300)] border-2 border-card" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{doc.specialty}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--brand-sage-900)] font-semibold">● {doc.wait}</p>
                <p className="text-[10px] text-muted-foreground">{doc.nextSlot}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t("label.heartRate"), value: "72 bpm", icon: Heart, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/40", trend: "+2%" },
          { label: t("label.bloodSugar"), value: "98 mg/dL", icon: Droplets, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/40", trend: "Normal" },
          { label: t("label.steps"), value: "8,432", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", trend: "84%" },
          { label: t("label.sleep"), value: "7h 20m", icon: Clock, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/40", trend: "Good" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`${stat.bg} p-2 rounded-xl`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                  {stat.trend}
                </span>
              </div>
              <p className="text-lg font-bold leading-tight">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heart Rate Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Heart Rate — This Week</CardTitle>
          <Badge variant="secondary" className="text-[10px]">Live</Badge>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis hide domain={[60, 80]} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 12 }} />
                <Line type="monotone" dataKey="bpm" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointment */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">{t("label.upcomingAppts")}</h2>
          <Link to="/patient/appointments" className="text-xs text-primary font-semibold">{t("action.viewAll")}</Link>
        </div>
        <Card className="border-l-4 border-l-primary overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">General Consultation</p>
                <p className="text-xs text-muted-foreground">Dr. Elena Rodriguez</p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Today • 10:30 AM</span>
                </div>
              </div>
              <Button size="sm" className="rounded-xl text-xs shrink-0">{t("action.joinRoom")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-2 opacity-70">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Cardiology Follow-up</p>
                <p className="text-xs text-muted-foreground">Dr. Marcus Thorne</p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">May 20 • 2:00 PM</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">Scheduled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Need Help */}
      <Card className="bg-gradient-to-r from-primary via-[var(--brand-lavender-500)] to-[var(--brand-lavender-700)] text-white border-none">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold mb-1">{t("label.needHelp")}</h3>
            <p className="text-white/80 text-xs mb-3">{t("label.needHelpDesc")}</p>
            <Link to="/patient/messages">
              <Button variant="secondary" size="sm" className="rounded-full text-xs gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                {t("action.startChat")}
              </Button>
            </Link>
          </div>
          <MessageSquare className="h-12 w-12 text-white/20 shrink-0" />
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">{t("label.prescriptions")}</h2>
          <Link to="/patient/prescriptions" className="text-xs text-primary font-semibold">{t("action.viewAll")}</Link>
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            {[
              { name: "Lisinopril", dosage: "10mg daily", status: "Active", refill: "30 days left" },
              { name: "Metformin", dosage: "500mg twice daily", status: "Refill Ready", refill: "Expires soon" },
              { name: "Atorvastatin", dosage: "20mg nightly", status: "Active", refill: "15 days left" },
            ].map((pill, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Pill className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{pill.name}</p>
                    <Badge
                      variant={pill.status === "Active" ? "secondary" : "success"}
                      className="text-[10px] ml-2 shrink-0"
                    >
                      {pill.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{pill.dosage} · {pill.refill}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full text-xs h-9 rounded-xl mt-1">
              {t("action.orderRefills")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">{t("label.recentDocs")}</h2>
          <Link to="/patient/documents" className="text-xs text-primary font-semibold">{t("action.viewAll")}</Link>
        </div>
        <div className="space-y-2">
          {[
            { name: "Blood Test Results", date: "May 12, 2026", type: "PDF", new: true },
            { name: "Prescription — Amoxicillin", date: "May 10, 2026", type: "Rx", new: false },
            { name: "ECG Report", date: "May 5, 2026", type: "PDF", new: false },
          ].map((doc, i) => (
            <Link key={i} to="/patient/documents">
              <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    {doc.new && <span className="text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full shrink-0">NEW</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.date} · {doc.type}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Identity */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t("label.identityVerified")}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Valid through Dec 2026 · HIPAA Compliant</p>
          </div>
          <TrendingUp className="h-4 w-4 text-emerald-500 ml-auto" />
        </CardContent>
      </Card>

      {/* Bottom spacer for nav */}
      <div className="h-4" />
    </div>
  );
}
