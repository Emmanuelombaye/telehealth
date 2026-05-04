import { Share2, Plus, TrendingUp, DollarSign, Users, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const affiliates = [
  { id: 1, name: "HealthBlog Pro", contact: "sarah@healthblog.com", referrals: 234, revenue: "$4,680", commission: "$468", rate: "10%", status: "active" },
  { id: 2, name: "MedInfluencer Network", contact: "team@medinfl.com", referrals: 189, revenue: "$3,780", commission: "$567", rate: "15%", status: "active" },
  { id: 3, name: "Corporate Wellness Co.", contact: "hr@corpwellness.com", referrals: 98, revenue: "$9,800", commission: "$980", rate: "10%", status: "active" },
  { id: 4, name: "FitLife Magazine", contact: "ads@fitlife.com", referrals: 12, revenue: "$240", commission: "$24", rate: "10%", status: "inactive" },
];

export function AdminAffiliatesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Affiliates</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Partner</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Active Partners", value: "3", icon: Users, color: "text-primary" }, { label: "Total Referrals", value: "533", icon: Share2, color: "text-blue-600" }, { label: "Revenue Generated", value: "$18.5K", icon: TrendingUp, color: "text-emerald-600" }, { label: "Commissions Paid", value: "$2.04K", icon: DollarSign, color: "text-amber-600" }].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {affiliates.map(a => (
          <Card key={a.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                  {a.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{a.name}</p>
                    <Badge variant={a.status === "active" ? "success" : "outline"} className="text-[10px]">{a.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.contact}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-muted-foreground">{a.referrals} referrals</span>
                    <span className="text-emerald-600 font-semibold">{a.revenue} revenue</span>
                    <span className="text-amber-600 font-semibold">{a.commission} commission ({a.rate})</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><ExternalLink className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
