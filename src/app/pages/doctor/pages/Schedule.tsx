import { Calendar, Clock, Video, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";
import { useNavigate } from "react-router";

export function DoctorSchedulePage() {
  const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleTime, setRescheduleTime] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('zoom_status', 'is', null)
        .neq('zoom_status', 'not_requested')
        .neq('zoom_status', 'canceled')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setScheduledOrders(data || []);
    } catch (err) {
      console.error("Schedule fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    const channel = supabase.channel('doctor-schedule-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchSchedule())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleConfirm = async (id: string) => {
    setIsUpdating(id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ zoom_status: 'confirmed' })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleReschedule = async (id: string) => {
    if (!rescheduleTime) return;
    setIsUpdating(id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          zoom_status: 'rescheduled',
          zoom_rescheduled_time: rescheduleTime 
        })
        .eq('id', id);
      if (error) throw error;
      setRescheduleTime("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Schedule</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-bold uppercase tracking-widest">
            Manage Video Consultations
          </p>
        </div>
        <Button size="sm" className="rounded-full gap-1.5 text-xs bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold">
          <Plus className="h-3.5 w-3.5" /> Add Availability
        </Button>
      </div>
      
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : scheduledOrders.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-bold italic uppercase tracking-widest">No consultations scheduled.</p>
            </CardContent>
          </Card>
        ) : (
          scheduledOrders.map((s) => {
            const timeDisplay = s.zoom_rescheduled_time || s.consultation_time || "Time Pending";
            const isConfirmed = s.zoom_status === "confirmed";
            const isRequested = s.zoom_status === "requested";

            return (
              <Card key={s.id} className={cn("transition-all border-l-4", 
                isConfirmed ? "border-l-emerald-500 bg-emerald-50/30" : 
                isRequested ? "border-l-amber-500 bg-amber-50/30" : "border-l-blue-500 bg-blue-50/30")}>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="text-center shrink-0 w-24">
                      <div className="h-10 w-10 rounded-2xl bg-white border border-border flex items-center justify-center mx-auto mb-2">
                        <Clock className={cn("h-5 w-5", isConfirmed ? "text-emerald-500" : isRequested ? "text-amber-500" : "text-blue-500")} />
                      </div>
                      <p className="text-xs font-black text-foreground uppercase">{timeDisplay.split(' ')[0]}</p>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-tighter">{timeDisplay.split(' ').slice(1).join(' ')}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-sm uppercase tracking-tight">{s.patient_name || "Patient Name"}</p>
                        <Badge className={cn("text-[9px] font-black uppercase border-none", 
                          isConfirmed ? "bg-emerald-100 text-emerald-700" : 
                          isRequested ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                          {s.zoom_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-bold">{s.medication}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Order #{s.order_number}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      {isRequested && (
                        <>
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              placeholder="New time (e.g. 2:00 PM)"
                              className="h-9 px-3 border border-border rounded-xl text-xs bg-white focus:border-primary outline-none"
                              value={rescheduleTime}
                              onChange={e => setRescheduleTime(e.target.value)}
                            />
                            <Button 
                              size="sm" variant="outline" className="rounded-xl h-9 text-[10px] font-bold"
                              onClick={() => handleReschedule(s.id)}
                              disabled={isUpdating === s.id}
                            >
                              Reschedule
                            </Button>
                          </div>
                          <Button 
                            size="sm" className="rounded-xl h-9 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleConfirm(s.id)}
                            disabled={isUpdating === s.id}
                          >
                            Confirm Appointment
                          </Button>
                        </>
                      )}
                      
                      {isConfirmed && (
                        <Button 
                          size="sm" className="rounded-xl h-10 px-6 text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 gap-2"
                          onClick={() => navigate(`/doctor/consult?orderId=${s.order_number}`)}>
                          <Video className="h-4 w-4" /> Join Consult Room
                        </Button>
                      )}

                      {!isRequested && !isConfirmed && (
                        <p className="text-xs font-bold text-muted-foreground italic">Waiting for patient to confirm new time...</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Manage Availability</h2>
        <Card className="overflow-hidden border-none shadow-md">
          {/* Calendly Inline Widget for Doctor to manage their availability/events */}
          <iframe 
            src={`https://calendly.com/calendly-demo?hide_event_type_details=1&hide_gdpr_banner=1`} 
            width="100%" 
            height="700" 
            frameBorder="0" 
            title="Calendly Scheduling"
            className="w-full bg-white rounded-2xl"
          />
        </Card>
      </div>
    </div>
  );
}
