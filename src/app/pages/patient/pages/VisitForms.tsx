import { FileCheck, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const visitForms = [
  { id: 1, title: "Chief Complaint Form", visit: "General Consultation — May 19", status: "pending", urgent: true },
  { id: 2, title: "Consent to Treat", visit: "General Consultation — May 19", status: "pending", urgent: true },
  { id: 3, title: "Telehealth Consent", visit: "General Consultation — May 19", status: "completed", urgent: false },
  { id: 4, title: "Post-Visit Satisfaction Survey", visit: "Cardiology — May 1", status: "pending", urgent: false },
  { id: 5, title: "Follow-up Symptom Check", visit: "Cardiology — May 1", status: "completed", urgent: false },
];

export function VisitFormsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Visit Forms</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Forms associated with your consultations</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-none bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">2</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-emerald-50 dark:bg-emerald-950/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-600">2</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {visitForms.map(form => (
          <Card key={form.id} className={cn("hover:border-primary/40 transition-colors", form.urgent && form.status === "pending" && "border-l-4 border-l-amber-500")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  form.status === "completed" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-amber-100 dark:bg-amber-950/40")}>
                  {form.status === "completed"
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    : <Clock className="h-5 w-5 text-amber-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{form.title}</p>
                    {form.urgent && form.status === "pending" && <Badge variant="destructive" className="text-[9px]">Urgent</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{form.visit}</p>
                </div>
                {form.status === "pending"
                  ? <Button size="sm" className="rounded-xl text-xs shrink-0">Fill Out</Button>
                  : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                }
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
