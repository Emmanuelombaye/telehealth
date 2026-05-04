import { Wrench, Zap, Bot, Workflow, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";
import { useState } from "react";

const tools = [
  { id: 1, name: "AI Symptom Checker", desc: "AI-powered triage tool for patients before booking.", status: true, category: "AI" },
  { id: 2, name: "Automated Reminders", desc: "SMS/email reminders for appointments and refills.", status: true, category: "Automation" },
  { id: 3, name: "Workflow Builder", desc: "Visual drag-and-drop workflow automation.", status: false, category: "Automation" },
  { id: 4, name: "Chatbot Assistant", desc: "24/7 patient support chatbot.", status: true, category: "AI" },
  { id: 5, name: "E-Prescribing Integration", desc: "Direct integration with pharmacy networks.", status: true, category: "Integration" },
  { id: 6, name: "Insurance Verification API", desc: "Real-time insurance eligibility checks.", status: false, category: "Integration" },
];

export function AdminToolsPage() {
  const [states, setStates] = useState<Record<number, boolean>>(Object.fromEntries(tools.map(t => [t.id, t.status])));

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Tools & Services</h1>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Active", count: Object.values(states).filter(Boolean).length, color: "text-emerald-600" }, { label: "Inactive", count: Object.values(states).filter(v => !v).length, color: "text-muted-foreground" }, { label: "Total", count: tools.length, color: "text-primary" }].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50"><CardContent className="p-3 text-center"><p className={`text-xl font-extrabold ${s.color}`}>{s.count}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>
      <div className="space-y-2">
        {tools.map(tool => (
          <Card key={tool.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {tool.category === "AI" ? <Bot className="h-5 w-5 text-primary" /> : tool.category === "Automation" ? <Workflow className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{tool.name}</p>
                    <Badge variant="outline" className="text-[10px]">{tool.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </div>
                <button onClick={() => setStates(s => ({ ...s, [tool.id]: !s[tool.id] }))} className="shrink-0">
                  {states[tool.id]
                    ? <ToggleRight className="h-7 w-7 text-primary" />
                    : <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
