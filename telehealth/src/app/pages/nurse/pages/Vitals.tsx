import { Heart, Activity, Thermometer, Wind, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const hrData = [
  { t: "09:00", hr: 72 }, { t: "09:15", hr: 75 }, { t: "09:30", hr: 78 }, { t: "09:45", hr: 74 },
  { t: "10:00", hr: 98 }, { t: "10:15", hr: 102 }, { t: "10:30", hr: 95 }, { t: "10:45", hr: 88 },
];

export function NurseVitalsPage() {
  const patients = [
    { name: "Alice Thompson", room: "Room 3", bp: "148/94", hr: "98", temp: "98.6°F", o2: "96%", rr: "18", alert: true },
    { name: "Robert Wilson", room: "Room 7", bp: "130/82", hr: "78", temp: "98.2°F", o2: "99%", rr: "14", alert: false },
    { name: "Maria Garcia", room: "Room 1", bp: "162/100", hr: "105", temp: "99.1°F", o2: "97%", rr: "22", alert: true },
    { name: "James Brown", room: "Room 5", bp: "120/78", hr: "72", temp: "98.4°F", o2: "100%", rr: "13", alert: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="h-6 w-6 text-pink-500" /> Vitals Monitoring</h1>
        <p className="text-sm text-muted-foreground">Live patient vitals and trending charts across all active rooms.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Heart Rate Trend – Alice Thompson (Room 3)</CardTitle></CardHeader>
          <CardContent>
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm font-semibold text-red-800">HR elevated above 95 bpm for last 30 min. Notify attending physician.</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis domain={[60, 115]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="hr" stroke="#ec4899" strokeWidth={2} dot={false} name="Heart Rate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">All Patients – Current Vitals Snapshot</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {patients.map((p, i) => (
              <div key={i} className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.room}</p>
                  </div>
                  {p.alert && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Alert</span>}
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[["BP", p.bp, "text-blue-500"], ["HR", p.hr, p.alert ? "text-red-500" : "text-emerald-500"], ["Temp", p.temp, ""], ["O₂", p.o2, ""], ["RR", p.rr + "/min", ""]].map(([l, v, c]) => (
                    <div key={l} className="bg-muted/50 rounded-lg p-1.5">
                      <p className="text-[10px] text-muted-foreground font-bold">{l}</p>
                      <p className={`text-xs font-bold ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
