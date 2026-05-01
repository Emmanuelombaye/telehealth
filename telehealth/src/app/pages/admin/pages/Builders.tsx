import { Layers, Plus, Edit2, Eye, Copy, Workflow, FileText, Mail } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const builders = [
  { id: 1, type: "workflow", name: "New Patient Onboarding", steps: 6, status: "active", lastEdited: "May 10" },
  { id: 2, type: "workflow", name: "Post-Visit Follow-up", steps: 4, status: "active", lastEdited: "May 8" },
  { id: 3, type: "email", name: "Appointment Confirmation Email", steps: 1, status: "active", lastEdited: "Apr 30" },
  { id: 4, type: "page", name: "Patient Welcome Page", steps: 3, status: "draft", lastEdited: "May 12" },
  { id: 5, type: "workflow", name: "Lab Result Notification", steps: 3, status: "active", lastEdited: "May 5" },
];

const typeIcons = { workflow: Workflow, email: Mail, page: FileText };
const typeColors = { workflow: "bg-blue-100 text-blue-600 dark:bg-blue-950/40", email: "bg-amber-100 text-amber-600 dark:bg-amber-950/40", page: "bg-purple-100 text-purple-600 dark:bg-purple-950/40" };

export function AdminBuildersPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Builders</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New Builder</Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Workflows", count: 3, icon: Workflow }, { label: "Emails", count: 1, icon: Mail }, { label: "Pages", count: 1, icon: FileText }].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
            <CardContent className="p-3 text-center">
              <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-extrabold">{s.count}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-2">
        {builders.map(b => {
          const Icon = typeIcons[b.type as keyof typeof typeIcons];
          return (
            <Card key={b.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[b.type as keyof typeof typeColors]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{b.name}</p>
                      <Badge variant={b.status === "active" ? "success" : "secondary"} className="text-[10px]">{b.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{b.type} · {b.steps} steps · Edited {b.lastEdited}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
