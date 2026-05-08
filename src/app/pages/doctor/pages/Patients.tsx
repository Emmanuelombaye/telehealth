import { useState, useEffect } from "react";
import { Search, Filter, Video, MessageSquare, FileText, ChevronRight, Activity, Clock } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";

export function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPatients() {
      try {
        // Fetch all orders to build a patient list
        // In a real system, we might have a 'profiles' or 'patients' table, 
        // but for now we derive from 'orders'
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group unique patients by name or ID
        const uniquePatients: any[] = [];
        const seen = new Set();

        (data || []).forEach(order => {
          const pId = order.patient_name || order.id;
          if (!seen.has(pId)) {
            seen.add(pId);
            uniquePatients.push({
              id: order.id,
              name: order.patient_name || "New Patient",
              age: order.patient_age || 30,
              condition: order.category || "General Treatment",
              lastVisit: new Date(order.created_at).toLocaleDateString(),
              status: order.status === 'delivered' ? 'Active' : 'In Progress',
              avatar: order.patient_avatar || "US",
              risk: order.urgent ? "high" : "low",
              medication: order.medication
            });
          }
        });

        setPatients(uniquePatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPatients();
  }, []);

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.condition.toLowerCase().includes(search.toLowerCase())
  );

  const riskColors = { low: "bg-emerald-100 text-emerald-700", medium: "bg-amber-100 text-amber-700", high: "bg-red-100 text-red-700" };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-sm text-muted-foreground">Manage your assigned patients and clinical records.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 rounded-full font-bold">
          {patients.length} Total Patients
        </Badge>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
            placeholder="Search by name, condition, or medication..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-10">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading patient directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            <p>No patients found matching your search.</p>
          </div>
        ) : filtered.map(p => (
          <Card key={p.id} className="hover:border-primary/40 transition-all cursor-pointer group">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0 group-hover:scale-105 transition-transform">
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{p.name}</p>
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full", riskColors[p.risk as keyof typeof riskColors])}>
                      {p.risk} risk
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.condition} · {p.medication} · Age {p.age}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Last active: {p.lastVisit}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl text-primary hover:bg-primary/10"><Video className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-muted"><MessageSquare className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-muted"><FileText className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
