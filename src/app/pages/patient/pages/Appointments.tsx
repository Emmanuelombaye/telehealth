import { useState } from "react";
import { Link } from "react-router";
import { Calendar, Clock, Video, MessageSquare, Plus, ChevronRight, Filter, MapPin, Star } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const upcoming = [
  { id: 1, doctor: "Dr. Sarah Johnson", specialty: "General Practice", date: "Today", time: "10:30 AM", type: "video", status: "confirmed", avatar: "SJ" },
  { id: 2, doctor: "Dr. Michael Chen", specialty: "Cardiology", date: "May 20", time: "2:00 PM", type: "video", status: "pending", avatar: "MC" },
  { id: 3, doctor: "Dr. Amira Hassan", specialty: "Dermatology", date: "May 25", time: "11:00 AM", type: "async", status: "confirmed", avatar: "AH" },
];

const past = [
  { id: 4, doctor: "Dr. Sarah Johnson", specialty: "General Practice", date: "May 1", time: "9:00 AM", type: "video", status: "completed", avatar: "SJ", rating: 5 },
  { id: 5, doctor: "Dr. Liu Wei", specialty: "Psychiatry", date: "Apr 22", time: "3:00 PM", type: "async", status: "completed", avatar: "LW", rating: 4 },
];

const doctors = [
  { id: 1, name: "Dr. Sarah Johnson", specialty: "General Practice", rating: 4.9, reviews: 312, wait: "< 5 min", avatar: "SJ", available: true },
  { id: 2, name: "Dr. Michael Chen", specialty: "Cardiology", rating: 4.8, reviews: 198, wait: "< 15 min", avatar: "MC", available: true },
  { id: 3, name: "Dr. Amira Hassan", specialty: "Dermatology", rating: 4.9, reviews: 445, wait: "Async only", avatar: "AH", available: false },
  { id: 4, name: "Dr. Carlos Rivera", specialty: "Endocrinology", rating: 4.7, reviews: 156, wait: "< 30 min", avatar: "CR", available: true },
];

export function AppointmentsPage() {
  const [tab, setTab] = useState<"upcoming" | "book" | "past">("upcoming");
  const [bookMode, setBookMode] = useState<"instant" | "async">("instant");

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Appointments</h1>
        <Button size="sm" className="rounded-full gap-1.5" onClick={() => setTab("book")}>
          <Plus className="h-4 w-4" /> Book
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-2xl p-1 gap-1">
        {(["upcoming", "book", "past"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 text-sm font-semibold rounded-xl transition-all capitalize",
              tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
            {t === "book" ? "Book New" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {tab === "upcoming" && (
        <div className="space-y-3">
          {upcoming.map(appt => (
            <Card key={appt.id} className={cn("overflow-hidden", appt.status === "confirmed" && "border-l-4 border-l-primary")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {appt.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm">{appt.doctor}</p>
                        <p className="text-xs text-muted-foreground">{appt.specialty}</p>
                      </div>
                      <Badge variant={appt.status === "confirmed" ? "success" : "secondary"} className="text-[10px] shrink-0">
                        {appt.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />{appt.date}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{appt.time}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {appt.type === "video" ? <Video className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                        {appt.type === "video" ? "Video" : "Async"}
                      </div>
                    </div>
                    {appt.status === "confirmed" && appt.date === "Today" && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="rounded-xl text-xs h-8 gap-1.5">
                          <Video className="h-3.5 w-3.5" /> Join Now
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">Reschedule</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Book New */}
      {tab === "book" && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="bg-muted rounded-2xl p-1 flex gap-1">
            <button onClick={() => setBookMode("instant")}
              className={cn("flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                bookMode === "instant" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
              <Video className="h-4 w-4" /> Instant / Scheduled
            </button>
            <button onClick={() => setBookMode("async")}
              className={cn("flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                bookMode === "async" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
              <MessageSquare className="h-4 w-4" /> Async Message
            </button>
          </div>

          {bookMode === "async" && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">📨 Asynchronous Consultation</p>
              <p className="text-xs opacity-80">Send your symptoms and questions. The doctor reviews and responds within 24 hours — no scheduling needed.</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Available Doctors</p>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
          </div>

          <div className="space-y-3">
            {doctors.filter(d => bookMode === "async" || d.available).map(doc => (
              <Card key={doc.id} className="hover:border-primary/40 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {doc.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold">{doc.rating}</span>
                          <span className="text-xs text-muted-foreground">({doc.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <Clock className="h-3 w-3" />{doc.wait}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="rounded-xl text-xs shrink-0">
                      {bookMode === "async" ? "Message" : "Book"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {tab === "past" && (
        <div className="space-y-3">
          {past.map(appt => (
            <Card key={appt.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm shrink-0">
                    {appt.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{appt.doctor}</p>
                    <p className="text-xs text-muted-foreground">{appt.specialty} · {appt.date}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: appt.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-7">Summary</Button>
                    <Button size="sm" variant="outline" className="rounded-xl text-xs h-7">Rebook</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
