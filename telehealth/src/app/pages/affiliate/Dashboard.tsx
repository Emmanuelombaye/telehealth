import { Card, CardContent, CardHeader, CardTitle, Button } from "../../components/ui/shared";
import { Share2, TrendingUp, Users, DollarSign, Copy } from "lucide-react";

export function AffiliateDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner Affiliate Dashboard</h1>
          <p className="text-sm text-muted-foreground">City Care Clinic Network</p>
        </div>
        <Button className="rounded-xl bg-orange-500 hover:bg-orange-600">Get Links</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Total Referrals", value: "458", icon: Users, color: "text-blue-500" },
          { title: "Conversion Rate", value: "12.4%", icon: TrendingUp, color: "text-emerald-500" },
          { title: "Pending Payout", value: "$1,240", icon: DollarSign, color: "text-orange-500" },
          { title: "Active Links", value: "5", icon: Share2, color: "text-purple-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Tracking Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "General Telehealth Campaign", url: "https://brandonhealth.com/ref/c3a4f", clicks: "1.2k", signups: "84" },
              { name: "Mental Health Awareness Month", url: "https://brandonhealth.com/ref/m8b2x", clicks: "840", signups: "52" },
              { name: "Pediatrics Virtual Clinic", url: "https://brandonhealth.com/ref/p9k1z", clicks: "450", signups: "18" },
            ].map((link, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="font-bold text-sm">{link.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-primary">{link.url}</p>
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                    <p className="font-bold">{link.clicks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Signups</p>
                    <p className="font-bold text-emerald-600">{link.signups}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
