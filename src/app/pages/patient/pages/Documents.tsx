import { FileText, Download, Upload, Search, Filter, FolderOpen } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const docs = [
  { id: 1, name: "Blood Test Results — May 2026", type: "Lab Report", date: "May 12, 2026", size: "245 KB", new: true },
  { id: 2, name: "ECG Report — Apr 2026", type: "Diagnostic", date: "Apr 22, 2026", size: "1.2 MB", new: false },
  { id: 3, name: "Prescription — Lisinopril", type: "Prescription", date: "May 1, 2026", size: "89 KB", new: false },
  { id: 4, name: "Insurance Card — BlueCross", type: "Insurance", date: "Jan 1, 2026", size: "156 KB", new: false },
  { id: 5, name: "Vaccination Record", type: "Immunization", date: "Mar 15, 2026", size: "320 KB", new: false },
  { id: 6, name: "Referral Letter — Cardiology", type: "Referral", date: "Apr 20, 2026", size: "112 KB", new: false },
];

const typeColors: Record<string, string> = {
  "Lab Report": "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  "Diagnostic": "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  "Prescription": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  "Insurance": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "Immunization": "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  "Referral": "bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400",
};

export function DocumentsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Documents</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" /> Upload
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search documents..." />
      </div>

      <div className="space-y-2">
        {docs.map(doc => (
          <Card key={doc.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{doc.name}</p>
                    {doc.new && <span className="text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full shrink-0">NEW</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[doc.type] || "bg-muted text-muted-foreground"}`}>{doc.type}</span>
                    <span className="text-[10px] text-muted-foreground">{doc.date} · {doc.size}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl shrink-0">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
