import { useState, useEffect } from "react";
import { Bell, Calendar, FileText, Pill, MessageSquare, ShieldCheck, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";

const iconMap: Record<string, any> = {
  appointment: Calendar,
  lab: FileText,
  message: MessageSquare,
  prescription: Pill,
  security: ShieldCheck,
  clinical: Bell,
};

const typeColors: Record<string, string> = {
  appointment: "bg-emerald-50 text-emerald-600 border-emerald-100",
  lab: "bg-blue-50 text-blue-600 border-blue-100",
  message: "bg-indigo-50 text-indigo-600 border-indigo-100",
  prescription: "bg-amber-50 text-amber-600 border-amber-100",
  security: "bg-red-50 text-red-600 border-red-100",
  clinical: "bg-slate-50 text-slate-600 border-slate-100",
};

export function DoctorNotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel('doctor-notifications-sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, fetchNotifications)
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
      setIsRefreshing(false);
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="text-sm font-medium text-slate-500">Syncing clinical alerts...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Clinical Alerts</h1>
            {unreadCount > 0 && (
              <Badge className="bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ring-4 ring-emerald-50">
                {unreadCount} NEW
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium">Real-time telemetry for your patient queue and communications.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setIsRefreshing(true); fetchNotifications(); }}
            disabled={isRefreshing}
            className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 h-10 px-4"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={markAllRead} 
            className="h-10 px-4 text-xs font-bold text-emerald-700 hover:bg-emerald-50 gap-2 rounded-xl"
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {notifications.length === 0 ? (
          <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2rem] p-20 text-center">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Bell className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">All clear</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-[240px] mx-auto">You've cleared all clinical notifications for now.</p>
          </div>
        ) : (
          notifications.map(n => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <Card 
                key={n.id} 
                className={cn(
                  "border border-slate-100 rounded-[1.5rem] transition-all hover:shadow-md hover:border-emerald-200 group relative overflow-hidden",
                  n.unread && "bg-emerald-50/30 border-emerald-100 shadow-sm"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-5">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 duration-300", 
                      typeColors[n.type] || typeColors.clinical
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className={cn(
                          "text-base font-black tracking-tight text-slate-900", 
                          n.unread && "text-emerald-950"
                        )}>
                          {n.title}
                        </h4>
                        <span className="text-[11px] font-bold text-slate-400 tabular-nums bg-slate-50 px-2 py-0.5 rounded-lg shrink-0">
                          {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed font-medium">
                        {n.body}
                      </p>
                    </div>

                    {n.unread && (
                      <div className="absolute top-0 right-0 h-full w-1.5 bg-emerald-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
