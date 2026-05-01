import { Users, Plus, Shield, Edit2, Trash2, Heart } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const members = [
  { id: 1, name: "Jane Doe", relation: "Spouse", age: 38, access: "Full", avatar: "JD" },
  { id: 2, name: "Emma Doe", relation: "Daughter", age: 12, access: "View Only", avatar: "ED" },
  { id: 3, name: "Robert Doe", relation: "Father", age: 68, access: "Emergency", avatar: "RD" },
];

export function FamilyAccessPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Family Access</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage who can access your health records</p>
        </div>
        <Button size="sm" className="rounded-full gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Member
        </Button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-300">
          Family members can only access what you explicitly allow. All access is logged for HIPAA compliance.
        </p>
      </div>

      <div className="space-y-3">
        {members.map(m => (
          <Card key={m.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                  {m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.relation} · Age {m.age}</p>
                  <Badge variant={m.access === "Full" ? "success" : m.access === "View Only" ? "secondary" : "outline"} className="text-[10px] mt-1">
                    {m.access}
                  </Badge>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
