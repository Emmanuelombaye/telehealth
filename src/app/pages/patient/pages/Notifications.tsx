import { Bell, Calendar, FileText, Pill, MessageSquare, ShieldCheck, CheckCheck } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const notifications = [
  { id: 1, type: "appointment", icon: Calendar, title: "Appointment Confirmed", body: "Dr. Sarah Johnson confirmed your appointment for May 19 at 10:30 AM.", time: "2 minutes ago", unread: true },
  { id: 2, type: "lab", icon: FileText, title: "Lab Results Ready", body: "Your CBC and Metabolic Panel results from May 12 are now available.", time: "1 hour ago", unread: true },
  { id: 3, type: "message", icon: MessageSquare, title: "New Message", body: "Dr. Michael Chen sent you a message about your upcoming cardiology visit.", time: "3 hours ago", unread: true },
  { id: 4, type: "prescription", icon: Pill, title: "Refill Approved", body: "Your Metformin 500mg refill has been approved and sent to Walgreens.", time: "Yesterday", unread: false },
  { id: 5, type: "security", icon: ShieldCheck, title: "Login from New Device", body: "A new login was detected from iPhone 15 in New York, NY.", time: "2 days ago", unread: false },
  { id: 6, type: "appointment", icon: Calendar, title: "Appointment Reminder", body: "You have a Cardiology follow-up with Dr. Chen in 2 days.", time: "2 days ago", unread: false },
];

const typeColors: Record<string, string> = {
  appointment: "bg-blue-100 text-blue-600 dark:bg-blue-950/40",
  lab: "bg-purple-100 text-purple-600 dark:bg-purple-950/40",
  message: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40",
  prescription: "bg-amber-100 text-amber-600 dark:bg-amber-950/40",
  security: "bg-red-100 text-red-600 dark:bg-red-950/40",
};

export function NotificationsPage() {
  const unread = notifications.filter(n => n.unread).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Notifications</h1>
          {unread > 0 && <Badge className="bg-primary text-white text-xs">{unread} new</Badge>}
        </div>
        <Button size="sm" variant="ghost" className="text-xs text-primary gap-1">
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <Card key={n.id} className={cn("hover:border-primary/30 transition-colors cursor-pointer", n.unread && "bg-primary/5 border-primary/20")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0", typeColors[n.type])}>
                  <n.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold", n.unread && "font-bold")}>{n.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                </div>
                {n.unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
