import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Heart, Activity } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const treatments = [
  { id: 1, name: "General Consultation", category: "Primary Care", price: "$75", duration: "30 min", active: true, bookings: 1240 },
  { id: 2, name: "Cardiology Assessment", category: "Specialist", price: "$200", duration: "60 min", active: true, bookings: 340 },
  { id: 3, name: "Mental Health Session", category: "Psychiatry", price: "$120", duration: "50 min", active: true, bookings: 890 },
  { id: 4, name: "Dermatology Async Review", category: "Dermatology", price: "$60", duration: "Async", active: true, bookings: 560 },
  { id: 5, name: "Nutrition Counseling", category: "Wellness", price: "$90", duration: "45 min", active: false, bookings: 120 },
  { id: 6, name: "Pediatric Check-up", category: "Pediatrics", price: "$85", duration: "30 min", active: true, bookings: 430 },
];

export function AdminTreatmentsPage() {
  const [search, setSearch] = useState("");
  const filtered = treatments.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Treatments</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Treatment</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total", value: treatments.length, color: "text-primary" }, { label: "Active", value: treatments.filter(t => t.active).length, color: "text-emerald-600" }, { label: "Inactive", value: treatments.filter(t => !t.active).length, color: "text-muted-foreground" }, { label: "Total Bookings", value: "3,580", color: "text-amber-600" }].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50"><CardContent className="p-3 text-center"><p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search treatments..." />
      </div>
      <div className="space-y-2">
        {filtered.map(t => (
          <Card key={t.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Heart className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{t.name}</p>
                    <Badge variant={t.active ? "success" : "outline"} className="text-[10px]">{t.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.category} · {t.duration} · {t.price} · {t.bookings} bookings</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
