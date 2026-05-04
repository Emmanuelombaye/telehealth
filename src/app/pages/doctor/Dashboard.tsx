import {
  Users, Calendar, Clock, Search, Filter, MoreVertical,
  Video, FileText, MessageSquare, TrendingUp, UserCheck, ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from "../../components/ui/shared";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useI18n, getGreeting } from "../../../lib";
import { Link } from "react-router";

const statsData = [
  { name: "Mon", visits: 12 }, { name: "Tue", visits: 18 }, { name: "Wed", visits: 15 },
  { name: "Thu", visits: 22 }, { name: "Fri", visits: 20 }, { name: "Sat", visits: 8 }, { name: "Sun", visits: 5 },
];

const patientQueue = [
  { id: 1, name: "Sophie Bennett", time: "09:00 AM", type: "Follow-up", status: "In Lobby", avatar: "SB", urgent: true },
  { id: 2, name: "Caleb Montgomery", time: "09:30 AM", type: "General Consult", status: "Ready", avatar: "CM", urgent: false },
  { id: 3, name: "Maya Brooks", time: "10:00 AM", type: "Lab Review", status: "Scheduled", avatar: "MB", urgent: false },
  { id: 4, name: "Isaiah Jackson", time: "10:30 AM", type: "Prescription", status: "Scheduled", avatar: "IJ", urgent: false },
];

export function DoctorDashboard() {
  const { t } = useI18n();
  const greeting = getGreeting(t);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl font-bold">Dr. Harrison Vance 👨‍⚕️</h1>
          <p className="text-sm text-muted-foreground mt-0.5">14 patients scheduled today</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/doctor/schedule">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.schedule")}</span>
            </Button>
          </Link>
          <Link to="/doctor/consult">
            <Button size="sm" className="rounded-xl gap-1.5 shadow-md shadow-primary/20">
              <Video className="h-4 w-4" />
              Start Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Patients Today", value: "14", sub: "+12% from yesterday", icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: "Avg. Wait Time", value: "8m 20s", sub: "−2m since last week", icon: Clock, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/40" },
          { label: "Completed Visits", value: "128", sub: "Monthly target reached", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <h3 className="text-2xl font-bold mt-1">{s.value}</h3>
                <div className="flex items-center mt-1.5 text-emerald-600 text-xs gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{s.sub}</span>
                </div>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <CardTitle className="text-base">Upcoming Patient Queue</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8 h-8 w-36 bg-muted/50 border-none text-xs rounded-xl" />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {patientQueue.map((patient) => (
                <div key={patient.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[11px] text-primary">
                      {patient.avatar}
                    </div>
                    {patient.urgent && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">{patient.time} · {patient.type}</p>
                  </div>
                  <Badge
                    variant={patient.status === "Ready" ? "success" : patient.status === "In Lobby" ? "secondary" : "default"}
                    className="text-[10px] shrink-0 hidden sm:flex"
                  >
                    {patient.status}
                  </Badge>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-primary">
                      <Video className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border/50 text-center">
              <Link to="/doctor/patients">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                  View Full Patient List <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          {/* Visit Trends */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Visit Trends</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                    <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                      {statsData.map((_, index) => (
                        <Cell key={index} fill={index === 3 ? "var(--primary)" : "var(--muted)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tools */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {[
                { label: "Prescription Builder", icon: FileText, href: "/doctor/consult" },
                { label: "Lab Requests", icon: Clock, href: "/doctor/labs" },
                { label: "Patient Messaging", icon: MessageSquare, href: "/doctor/messages" },
              ].map((tool, i) => (
                <Link key={i} to={tool.href}>
                  <Button variant="outline" className="w-full justify-between text-sm h-10 px-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <tool.icon className="h-4 w-4 text-primary" />
                      {tool.label}
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
