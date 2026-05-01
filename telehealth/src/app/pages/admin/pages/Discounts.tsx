import { Tag, Plus, Copy, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";
import { useState } from "react";

const discounts = [
  { id: 1, code: "WELCOME20", type: "Percentage", value: "20%", uses: 340, limit: 500, expires: "Jun 30, 2026", active: true },
  { id: 2, code: "FIRSTVISIT", type: "Fixed", value: "$25 off", uses: 1200, limit: null, expires: "Dec 31, 2026", active: true },
  { id: 3, code: "SUMMER10", type: "Percentage", value: "10%", uses: 89, limit: 200, expires: "Aug 31, 2026", active: true },
  { id: 4, code: "EXPIRED50", type: "Percentage", value: "50%", uses: 45, limit: 50, expires: "Apr 1, 2026", active: false },
];

export function AdminDiscountsPage() {
  const [states, setStates] = useState<Record<number, boolean>>(Object.fromEntries(discounts.map(d => [d.id, d.active])));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Discounts</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Create Code</Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Active Codes", value: Object.values(states).filter(Boolean).length, color: "text-emerald-600" }, { label: "Total Uses", value: "1,674", color: "text-primary" }, { label: "Revenue Saved", value: "$12.4K", color: "text-amber-600" }].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50"><CardContent className="p-3 text-center"><p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>
      <div className="space-y-3">
        {discounts.map(d => (
          <Card key={d.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0"><Tag className="h-5 w-5 text-amber-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-bold text-sm bg-muted px-2 py-0.5 rounded-lg">{d.code}</code>
                    <Badge variant="outline" className="text-[10px]">{d.type}</Badge>
                    <span className="text-sm font-bold text-primary">{d.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.uses} uses {d.limit ? `/ ${d.limit} limit` : "(unlimited)"} · Expires {d.expires}
                  </p>
                  {d.limit && (
                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden w-32">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(d.uses / d.limit) * 100}%` }} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => navigator.clipboard?.writeText(d.code)} className="p-1.5 rounded-lg hover:bg-accent"><Copy className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => setStates(s => ({ ...s, [d.id]: !s[d.id] }))}>
                    {states[d.id] ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
