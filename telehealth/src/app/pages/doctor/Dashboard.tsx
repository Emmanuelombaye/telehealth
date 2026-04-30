import { 
  Users, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical,
  Video,
  FileText,
  MessageSquare,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from "../../components/ui/shared";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const statsData = [
  { name: 'Mon', visits: 12 },
  { name: 'Tue', visits: 18 },
  { name: 'Wed', visits: 15 },
  { name: 'Thu', visits: 22 },
  { name: 'Fri', visits: 20 },
  { name: 'Sat', visits: 8 },
  { name: 'Sun', visits: 5 },
];

const patientQueue = [
  { id: 1, name: "Alice Thompson", time: "09:00 AM", type: "Follow-up", status: "In Lobby", avatar: "AT" },
  { id: 2, name: "Robert Wilson", time: "09:30 AM", type: "General Consult", status: "Ready", avatar: "RW" },
  { id: 3, name: "Sarah Miller", time: "10:00 AM", type: "Lab Review", status: "Scheduled", avatar: "SM" },
  { id: 4, name: "James Brown", time: "10:30 AM", type: "Prescription", status: "Scheduled", avatar: "JB" },
];

export function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Doctor's Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. Brandan. You have 14 patients scheduled today.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Full Schedule
          </Button>
          <Button>
            <Video className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Patients Today</p>
              <h3 className="text-2xl font-bold mt-1">14</h3>
              <div className="flex items-center mt-2 text-emerald-500 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+12% from yesterday</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Avg. Wait Time</p>
              <h3 className="text-2xl font-bold mt-1">8m 20s</h3>
              <div className="flex items-center mt-2 text-emerald-500 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>-2m since last week</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Completed Visits</p>
              <h3 className="text-2xl font-bold mt-1">128</h3>
              <div className="flex items-center mt-2 text-emerald-500 text-xs">
                <UserCheck className="h-3 w-3 mr-1" />
                <span>Monthly target reached</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <CardTitle>Upcoming Patient Queue</CardTitle>
            <div className="flex items-center space-x-2">
               <div className="relative hidden md:block">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search queue..." 
                    className="pl-8 h-9 w-[150px] bg-muted/50 border-none"
                  />
               </div>
               <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="h-4 w-4" />
               </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="px-6 py-3 text-left font-medium">Patient</th>
                    <th className="px-6 py-3 text-left font-medium">Time</th>
                    <th className="px-6 py-3 text-left font-medium">Type</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {patientQueue.map((patient) => (
                    <tr key={patient.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                            {patient.avatar}
                          </div>
                          <span className="font-semibold">{patient.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{patient.time}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{patient.type}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={patient.status === "Ready" ? "success" : patient.status === "In Lobby" ? "secondary" : "default"}
                          className="capitalize"
                        >
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                              <Video className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border/50 text-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                View Full Patient List
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visit Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.05)'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                       {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 4 ? 'var(--primary)' : '#cbd5e1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
               {[
                 { label: "Prescription Builder", icon: FileText },
                 { label: "Lab Requests", icon: Clock },
                 { label: "Patient Messaging", icon: MessageSquare }
               ].map((tool, i) => (
                 <Button key={i} variant="outline" className="w-full justify-start text-sm h-11 px-4">
                   <tool.icon className="h-4 w-4 mr-3 text-primary" />
                   {tool.label}
                 </Button>
               ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
