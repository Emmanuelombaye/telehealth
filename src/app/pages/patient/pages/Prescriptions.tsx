import { useState, useEffect } from "react";
import { Pill, MapPin, Clock, Loader2, ShoppingBag } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { Link } from "react-router";

export function PrescriptionsPage() {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', user!.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setPrescriptions(data || []);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }
    fetch();
    const ch = supabase.channel('px').on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, fetch).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const cfg = (s: string) => ({
    active: { label: 'Active', pill: 'text-amber-600', bg: 'bg-amber-100' },
    inactive:  { label: 'Inactive',       pill: 'text-blue-600',  bg: 'bg-blue-100'  },
    completed:{ label: 'Completed',     pill: 'text-emerald-600',bg: 'bg-emerald-100'},
  } as any)[s] || { label: s, pill: 'text-muted-foreground', bg: 'bg-muted' };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Prescriptions</h1>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", count: prescriptions.filter(p=>p.status==='active').length, color: "text-amber-600" },
          { label: "Inactive", count: prescriptions.filter(p=>p.status==='inactive').length, color: "text-blue-600" },
          { label: "Completed", count: prescriptions.filter(p=>p.status==='completed').length, color: "text-emerald-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {prescriptions.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-10 text-center">
            <ShoppingBag className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-bold">No prescriptions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Once a doctor approves your request, it appears here.</p>
            <Link to="/patient/shop"><Button className="rounded-xl mt-4">Browse Treatments</Button></Link>
          </CardContent>
        </Card>
      ) : prescriptions.map(rx => {
        const c = cfg(rx.status);
        return (
          <Card key={rx.id} className={cn("hover:border-primary/40 transition-colors", rx.status==='active' && "border-l-4 border-l-amber-500")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0", c.bg)}>
                  <Pill className={cn("h-5 w-5", c.pill)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm">{rx.medication_name}</p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{c.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rx.dosage || "As directed"} · {rx.prescribing_doctor || "Your provider"}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {rx.pharmacy_id && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3"/>Pharmacy</span>}
                    {rx.created_at && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3"/>Ordered {new Date(rx.created_at).toLocaleDateString()}</span>}
                  </div>
                  {rx.instructions && <p className="text-xs italic mt-2 bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground">"{rx.instructions}"</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
