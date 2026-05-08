import { useState, useEffect } from "react";
import { TestTube, TrendingUp, TrendingDown, Minus, Download, AlertCircle, Loader2, FlaskConical } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

const statusConfig = {
  normal: { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: Minus },
  high:   { color: "text-red-600",     bg: "bg-red-50 dark:bg-red-950/30",     icon: TrendingUp },
  low:    { color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/30", icon: TrendingDown },
};

export function LabResultsPage() {
  const { user } = useAuthStore();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('lab_results')
          .select('*')
          .eq('patient_id', user!.id)
          .order('created_at', { ascending: false });
        if (error && error.code !== '42P01') throw error; // 42P01 = table doesn't exist yet
        setResults(data || []);
      } catch (err) {
        console.error("Lab results fetch error:", err);
      } finally { setLoading(false); }
    }
    fetch();
  }, [user]);

  const newCount = results.filter(r => r.status === 'new').length;
  const outOfRange = results.flatMap(r => (r.tests || [])).filter((t: any) => t.status !== 'normal').length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Lab Results</h1>
        {newCount > 0 && <Badge className="bg-primary text-white text-xs">{newCount} New</Badge>}
      </div>

      {outOfRange > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{outOfRange} value{outOfRange > 1 ? 's' : ''} outside reference range</p>
            <p className="text-xs text-amber-700 mt-0.5">Your doctor has been notified and will review shortly.</p>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-10 text-center">
            <FlaskConical className="h-10 w-10 text-primary mx-auto mb-3 opacity-50" />
            <h3 className="font-bold">No lab results yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Your doctor can order lab work during a consultation. Results will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map(panel => (
            <Card key={panel.id} className={cn(panel.status === "new" && "border-primary/40 border-2")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{panel.panel_name}</p>
                      {panel.status === "new" && <Badge className="text-[9px] bg-primary text-white">NEW</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {panel.created_at ? new Date(panel.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''} · {panel.ordered_by || 'Your provider'}
                    </p>
                  </div>
                  {panel.report_url && (
                    <a href={panel.report_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 gap-1 shrink-0">
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                    </a>
                  )}
                </div>
                <div className="space-y-2">
                  {(panel.tests || []).map((test: any, i: number) => {
                    const cfg = statusConfig[test.status as keyof typeof statusConfig] || statusConfig.normal;
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className={cn("flex items-center justify-between p-2.5 rounded-xl", cfg.bg)}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
                          <span className="text-sm font-medium">{test.name}</span>
                        </div>
                        <div className="text-right">
                          <span className={cn("text-sm font-bold", cfg.color)}>{test.value} {test.unit}</span>
                          <p className="text-[10px] text-muted-foreground">Ref: {test.range}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
