import { TestTube, TrendingUp, TrendingDown, Minus, Download, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const results = [
  {
    id: 1, panel: "Complete Blood Count (CBC)", date: "May 12, 2026", orderedBy: "Dr. Sarah Johnson", status: "reviewed",
    tests: [
      { name: "WBC", value: "7.2", unit: "K/uL", range: "4.5–11.0", status: "normal" },
      { name: "RBC", value: "4.8", unit: "M/uL", range: "4.5–5.9", status: "normal" },
      { name: "Hemoglobin", value: "13.2", unit: "g/dL", range: "13.5–17.5", status: "low" },
      { name: "Platelets", value: "245", unit: "K/uL", range: "150–400", status: "normal" },
    ]
  },
  {
    id: 2, panel: "Comprehensive Metabolic Panel", date: "May 12, 2026", orderedBy: "Dr. Sarah Johnson", status: "new",
    tests: [
      { name: "Glucose", value: "98", unit: "mg/dL", range: "70–100", status: "normal" },
      { name: "Creatinine", value: "1.1", unit: "mg/dL", range: "0.7–1.3", status: "normal" },
      { name: "ALT", value: "52", unit: "U/L", range: "7–40", status: "high" },
      { name: "Sodium", value: "140", unit: "mEq/L", range: "136–145", status: "normal" },
    ]
  },
];

const statusConfig = {
  normal: { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: Minus },
  high: { color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", icon: TrendingUp },
  low: { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", icon: TrendingDown },
};

export function LabResultsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Lab Results</h1>
        <Badge variant="default" className="bg-primary text-white text-xs">1 New</Badge>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">2 values outside reference range</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Your doctor has been notified and will review shortly.</p>
        </div>
      </div>

      <div className="space-y-4">
        {results.map(panel => (
          <Card key={panel.id} className={cn(panel.status === "new" && "border-primary/40 border-2")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{panel.panel}</p>
                    {panel.status === "new" && <Badge className="text-[9px] bg-primary text-white">NEW</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{panel.date} · {panel.orderedBy}</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 gap-1 shrink-0">
                  <Download className="h-3 w-3" /> PDF
                </Button>
              </div>

              <div className="space-y-2">
                {panel.tests.map((test, i) => {
                  const cfg = statusConfig[test.status as keyof typeof statusConfig];
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
    </div>
  );
}
