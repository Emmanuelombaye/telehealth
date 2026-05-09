import { useState, useEffect } from "react";
import { FileText, Download, ChevronRight, Video, MessageSquare, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

export function VisitSummariesPage() {
  const { user } = useAuthStore();
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('visit_summaries')
          .select('*')
          .eq('patient_id', user!.id)
          .order('date', { ascending: false });
        if (error) throw error;
        setSummaries(data || []);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Visit Summaries</h1>
      <div className="space-y-3">
        {summaries.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="p-10 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No visit summaries yet</p>
              <p className="text-xs mt-1">Your doctor will provide a summary after each consultation.</p>
            </CardContent>
          </Card>
        ) : summaries.map(s => (
          <Card key={s.id} className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  {s.type === "video" ? <Video className="h-5 w-5 text-primary" /> : <MessageSquare className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{s.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">{s.specialty} · {new Date(s.date).toLocaleDateString()}</p>
                  <div className="mt-2 bg-muted/60 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diagnosis</p>
                    <p className="text-sm font-medium mt-0.5">{s.diagnosis}</p>
                  </div>
                  {s.follow_up_date && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <Calendar className="h-3 w-3" /> Follow-up: {new Date(s.follow_up_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {s.report_url && (
                    <a href={s.report_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 gap-1">
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
