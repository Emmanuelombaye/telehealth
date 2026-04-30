import { 
  Calendar, 
  Clock, 
  FileText, 
  Activity, 
  MessageSquare, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Droplets,
  Heart
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "../../components/ui/shared";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const healthData = [
  { day: 'Mon', bpm: 72 },
  { day: 'Tue', bpm: 75 },
  { day: 'Wed', bpm: 68 },
  { day: 'Thu', bpm: 74 },
  { day: 'Fri', bpm: 70 },
  { day: 'Sat', bpm: 65 },
  { day: 'Sun', bpm: 69 },
];

export function PatientDashboard() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good morning, John</h1>
          <p className="text-muted-foreground">You have 1 appointment today.</p>
        </div>
        <Button className="rounded-full h-12 w-12 md:h-auto md:w-auto md:rounded-md" size="icon">
          <Plus className="h-6 w-6 md:hidden" />
          <span className="hidden md:inline">Book Visit</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Heart Rate", value: "72 bpm", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Blood Sugar", value: "98 mg/dL", icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Steps", value: "8,432", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Sleep", value: "7h 20m", icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-none bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`${stat.bg} p-2 rounded-full mb-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Health Activity</CardTitle>
              <Badge variant="secondary">Heart Rate</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bpm" 
                      stroke="var(--primary)" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: 'var(--primary)' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Appointments */}
          <div className="space-y-4">
            <h3 className="font-bold">Upcoming Appointments</h3>
            <Card className="overflow-hidden border-l-4 border-l-primary">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold">General Consultation</h4>
                    <p className="text-sm text-muted-foreground">Dr. Sarah Johnson • 10:30 AM</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Join Room</Button>
              </CardContent>
            </Card>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Recent Documents</h3>
              <Button variant="ghost" size="sm" className="text-primary">View All</Button>
            </div>
            <div className="space-y-2">
              {[
                { name: "Blood Test Results", date: "May 12, 2026", type: "PDF" },
                { name: "Prescription - Amoxicillin", date: "May 10, 2026", type: "Prescription" }
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.date}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar for Patient Desktop/Tablets */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Chat with our AI assistant or connect with a nurse immediately.
              </p>
              <Button variant="secondary" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prescriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Lisinopril", dosage: "10mg daily", status: "Active" },
                { name: "Metformin", dosage: "500mg daily", status: "Refill Ready" }
              ].map((pill, i) => (
                <div key={i} className="flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{pill.name}</span>
                    <Badge variant={pill.status === "Active" ? "secondary" : "success"} className="text-[10px]">
                      {pill.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{pill.dosage}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full text-xs h-8">Order Refills</Button>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
              <CardTitle className="text-base">Identity Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 text-emerald-500">
                <div className="p-2 rounded-full bg-emerald-100">
                   <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">Valid through Dec 2026</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
