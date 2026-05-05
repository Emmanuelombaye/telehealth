import { Link } from "react-router";
import {
  Search, Clock, MessageSquare, Bell, Calendar,
  MoreHorizontal, ArrowUpRight, ArrowDownRight, Info,
  Package, CreditCard, DollarSign
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/shared";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const salesData = [
  { date: "Apr 28", current: 0, previous: 900 },
  { date: "Apr 29", current: 400, previous: 700 },
  { date: "Apr 30", current: 300, previous: 1400 },
  { date: "May 1", current: 1800, previous: 700 },
  { date: "May 2", current: 300, previous: 1300 },
  { date: "May 3", current: 300, previous: 0 },
  { date: "May 4", current: 0, previous: 900 },
  { date: "May 5", current: 0, previous: 300 },
];

const netRevenueData = [
  { name: "Revenue", value: 2739, color: "#60a5fa" }, // Light blue
  { name: "Empty", value: 1000, color: "#f1f5f9" }   // Gray/Empty
];

export function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Good night, Leo <span className="text-sm font-normal text-muted-foreground mt-1">• Last updated: 11:20:47 PM</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 text-sm shadow-sm cursor-pointer hover:bg-muted/50 transition">
            <span className="font-medium text-foreground">Apr 28, 2026 - May 05, 2026</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side (Charts and Stats) - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top 3 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Total Sales</p>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">-54.52%</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">$2,792.00</h2>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</p>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">-49.83%</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">$2,090.82</h2>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Gross Income</p>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">$648.18</h2>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="shadow-sm border-border/60 pt-6">
            <CardContent>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} 
                      formatter={(v: any) => [`$${v}`, "Amount"]} 
                    />
                    {/* Dashed line for previous period */}
                    <Area type="monotone" dataKey="previous" stroke="#94a3b8" strokeDasharray="5 5" fill="transparent" strokeWidth={2} />
                    {/* Solid line for current period */}
                    <Area type="monotone" dataKey="current" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCurrent)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 flex flex-col text-[13px] text-muted-foreground gap-1.5 border-t border-border/40 pt-4">
                <p><span className="font-semibold text-foreground mr-2">Current Period:</span> Apr 28, 2026 - May 5, 2026</p>
                <p><span className="font-semibold text-foreground mr-2">Previous Period:</span> Apr 20, 2026 - Apr 27, 2026</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side (Live Summary & Net Revenue) - 1 column */}
        <div className="space-y-6">
          
          {/* Live Summary */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Live Summary <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                </h3>
                <a href="#" className="text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors">View more</a>
              </div>
              
              <div className="flex justify-between items-center px-2">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-full border border-border flex items-center justify-center bg-muted/30 shadow-sm transition-transform hover:scale-105">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-2xl font-bold">0</span>
                  <span className="text-xs font-medium text-muted-foreground text-center leading-tight">Active<br/>carts</span>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-full border border-border flex items-center justify-center bg-muted/30 shadow-sm transition-transform hover:scale-105">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-2xl font-bold">0</span>
                  <span className="text-xs font-medium text-muted-foreground text-center leading-tight">Checking<br/>out</span>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-full border border-border flex items-center justify-center bg-muted/30 shadow-sm transition-transform hover:scale-105">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-2xl font-bold">0</span>
                  <span className="text-xs font-medium text-muted-foreground text-center leading-tight">Purchased</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Revenue */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Net Revenue</h3>
                <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              <div className="h-[280px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={netRevenueData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={80} 
                      outerRadius={115} 
                      startAngle={90} 
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {netRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text for Doughnut */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Net Revenue</span>
                  <span className="text-3xl font-bold tracking-tight text-foreground">$2,739.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
