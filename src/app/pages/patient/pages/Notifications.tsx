import { useState, useEffect } from "react";
import { Bell, Calendar, FileText, Pill, MessageSquare, ShieldCheck, CheckCheck, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

const iconMap: Record<string, any> = {
  appointment: Calendar,
  lab: FileText,
  message: MessageSquare,
  prescription: Pill,
  security: ShieldCheck,
};

const typeColors: Record<string, string> = {
  appointment: "bg-violet-100 text-violet-600 dark:bg-violet-950/40",
  lab: "bg-purple-100 text-purple-600 dark:bg-purple-950/40",
  message: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40",
  prescription: "bg-amber-100 text-amber-600 dark:bg-amber-950/40",
  security: "bg-red-100 text-red-600 dark:bg-red-950/40",
};

export function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('notifications-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function fetchNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  }

  const markAllRead = async () => {
    if (!user) return;
    try {
      await supabase.from('notifications').update({ unread: false }).eq('user_id', user.id);
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Notifications</h1>
          {unreadCount > 0 && <Badge className="bg-primary text-white text-xs">{unreadCount} new</Badge>}
        </div>
        <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs text-primary gap-1">
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No notifications yet</p>
            </CardContent>
          </Card>
        ) : notifications.map(n => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <Card key={n.id} className={cn("hover:border-primary/30 transition-colors cursor-pointer", n.unread && "bg-primary/5 border-primary/20")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0", typeColors[n.type])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-semibold", n.unread && "font-bold")}>{n.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                  {n.unread && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
