import { FileText, Download, ChevronRight, Video, MessageSquare, Calendar } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const summaries = [
  { id: 1, doctor: "Dr. Sarah Johnson", specialty: "General Practice", date: "May 1, 2026", type: "video", diagnosis: "Hypertension — Stage 1", followUp: "May 19, 2026" },
  { id: 2, doctor: "Dr. Michael Chen", specialty: "Cardiology", date: "Apr 22, 2026", type: "video", diagnosis: "Benign Palpitations", followUp: "May 20, 2026" },
  { id: 3, doctor: "Dr. Amira Hassan", specialty: "Dermatology", date: "Apr 10, 2026", type: "async", diagnosis: "Contact Dermatitis", followUp: null },
];

export function VisitSummariesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Visit Summaries</h1>
      <div className="space-y-3">
        {summaries.map(s => (
          <Card key={s.id} className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  {s.type === "video" ? <Video className="h-5 w-5 text-primary" /> : <MessageSquare className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{s.doctor}</p>
                  <p className="text-xs text-muted-foreground">{s.specialty} · {s.date}</p>
                  <div className="mt-2 bg-muted/60 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diagnosis</p>
                    <p className="text-sm font-medium mt-0.5">{s.diagnosis}</p>
                  </div>
                  {s.followUp && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <Calendar className="h-3 w-3" /> Follow-up: {s.followUp}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 gap-1">
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
