import { Link } from "react-router";
import {
  Calendar, Clock, FileText, Activity, MessageSquare, Plus,
  ArrowRight, Droplets, Heart, ChevronRight, Video, Pill,
  ShieldCheck, TrendingUp, Bell
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../components/ui/shared";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n, getGreeting } from "../../../lib";

const healthData = [
  { day: "Mon", bpm: 72 }, { day: "Tue", bpm: 75 }, { day: "Wed", bpm: 68 },
  { day: "Thu", bpm: 74 }, { day: "Fri", bpm: 70 }, { day: "Sat", bpm: 65 }, { day: "Sun", bpm: 69 },
];

export function PatientDashboard() {
  const { t } = useI18n();
  const greeting = getGreeting(t);

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
      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
        <Bell className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
          Lab results from May 12 are ready. <Link to="/patient/labs" className="underline">View now</Link>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t("label.heartRate"), value: "72 bpm", icon: Heart, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/40", trend: "+2%" },
          { label: t("label.bloodSugar"), value: "98 mg/dL", icon: Droplets, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40", trend: "Normal" },
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
      <Card className="bg-gradient-to-r from-primary to-blue-600 text-white border-none">
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
