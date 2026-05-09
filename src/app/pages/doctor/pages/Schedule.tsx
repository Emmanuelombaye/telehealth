import { Calendar, Clock, Video, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";
import { useNavigate } from "react-router";

export function DoctorSchedulePage() {
  const { orders } = usePatientStore();
  const navigate = useNavigate();

  // Filter orders that have a zoom request or confirmed time
  const scheduledOrders = orders.filter(o => 
    o.zoomStatus && 
    o.zoomStatus !== 'not_requested' && 
    o.zoomStatus !== 'canceled'
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Schedule</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Slot</Button>
      </div>
      
      {/* Date picker mock for UI feel */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Today", "Tomorrow"].map((d, i) => (
          <button key={i} className={cn("flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all", i === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent")}>{d}</button>
        ))}
      </div>
      
      <div className="space-y-2">
        {scheduledOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-bold">No consultations scheduled.</p>
          </div>
        ) : (
          scheduledOrders.map((s, i) => {
            const timeDisplay = s.zoom_rescheduled_time || s.consultationTime || "Pending Time";
            const isConfirmed = s.zoomStatus === "confirmed";

            return (
              <Card key={s.id} className={cn("hover:border-primary/40 transition-colors", isConfirmed && "border-l-4 border-l-primary")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center shrink-0 w-16">
                      <p className="text-xs font-bold text-primary">{timeDisplay}</p>
                      <p className="text-[10px] text-muted-foreground">30 min</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{s.patientName}</p>
                      <p className="text-xs text-muted-foreground">{s.medication}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={isConfirmed ? "success" : "secondary"} className="text-[10px] uppercase">{s.zoomStatus}</Badge>
                      <Button size="sm" className="rounded-xl text-xs h-8 gap-1"
                        onClick={() => navigate(`/doctor/consult?orderId=${s.id}`)}>
                        <Video className="h-3.5 w-3.5" /> {isConfirmed ? "Start Call" : "Review"}
                      </Button>
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
