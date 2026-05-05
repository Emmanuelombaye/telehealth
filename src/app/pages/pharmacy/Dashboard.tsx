import { useState } from "react";
import { 
  ClipboardList, Package, Truck, FlaskConical, 
  AlertTriangle, CheckCircle2, Search, Filter,
  ArrowUpRight, Clock, Box, ShieldAlert, 
  ChevronRight, MoreHorizontal, Printer, Mail
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../components/ui/shared";

const stats = [
  { label: "New Rx Requests", value: "12", sub: "Last 2 hours", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Pending Verification", value: "8", sub: "Awaiting pharmacist", icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Ready to Ship", value: "24", sub: "Pickup scheduled", icon: Package, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Inventory Alerts", value: "3", sub: "Action required", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
];

const incomingRx = [
  { id: "RX-9912", patient: "Sophie Bennett", drug: "Semaglutide 0.25mg", date: "Just now", status: "New", urgent: true },
  { id: "RX-9910", patient: "Caleb Montgomery", drug: "Sildenafil 50mg", date: "12m ago", status: "Verifying", urgent: false },
  { id: "RX-9908", patient: "Maya Brooks", drug: "Escitalopram 10mg", date: "45m ago", status: "Processing", urgent: false },
  { id: "RX-9905", patient: "Liam Wilson", drug: "Finasteride 1mg", date: "1h ago", status: "Reviewing", urgent: false },
];

const shippingQueue = [
  { id: "SH-4421", patient: "Emma Davis", method: "FedEx Overnight", destination: "TX, USA", status: "Label Generated" },
  { id: "SH-4418", patient: "Noah Brown", method: "UPS Ground", destination: "NY, USA", status: "Awaiting Pickup" },
];

export function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0A0D14]">Dispensary Dashboard</h1>
          <p className="text-slate-500 font-medium">VialsRX Pharmacy #4401 · California Hub</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-2xl gap-2 font-bold h-11">
            <Printer className="h-4 w-4" /> Batch Labels
          </Button>
          <Button className="rounded-2xl gap-2 font-black uppercase text-xs tracking-widest h-11 bg-[#0A0D14] text-white">
            <FlaskConical className="h-4 w-4" /> Compounding Log
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/40 hover:scale-[1.02] transition-transform duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-3xl font-black text-[#0A0D14] mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-2">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Rx Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-[#0A0D14] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Incoming Prescriptions
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["all", "urgent", "flagged"].map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t)}
                  className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === t ? "bg-white text-[#0A0D14] shadow-sm" : "text-slate-400")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {incomingRx.map((rx, i) => (
              <Card key={i} className={cn("hover:border-primary/40 transition-all cursor-pointer group", rx.urgent && "border-l-4 border-l-red-500")}>
                <CardContent className="p-5 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Pill className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-[#0A0D14]">{rx.patient}</p>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight">{rx.id}</Badge>
                      {rx.urgent && <Badge className="bg-red-500 text-white text-[9px] font-black animate-pulse">URGENT</Badge>}
                    </div>
                    <p className="text-sm font-bold text-slate-500">{rx.drug}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> Received {rx.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right mr-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <span className="text-xs font-black text-emerald-600">{rx.status}</span>
                    </div>
                    <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="ghost" className="w-full h-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:bg-slate-50">
              View All 42 Incoming Orders
            </Button>
          </div>
        </div>

        {/* Sidebar: Shipping & Inventory */}
        <div className="space-y-8">
          {/* Shipping Queue */}
          <div className="space-y-4">
             <h2 className="text-xl font-black text-[#0A0D14] flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-600" /> Shipping Hub
            </h2>
            <Card className="border-none shadow-xl shadow-slate-200/40 bg-emerald-500 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Next Pickup</p>
                <p className="text-2xl font-black mb-4">FedEx @ 2:30 PM</p>
                <div className="space-y-3">
                  {shippingQueue.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10">
                      <div>
                        <p className="text-[10px] font-black uppercase opacity-80">{s.id}</p>
                        <p className="text-sm font-bold truncate max-w-[120px]">{s.patient}</p>
                      </div>
                      <Badge className="bg-white text-emerald-600 text-[9px] font-black">{s.status}</Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-white text-emerald-600 hover:bg-white/90 rounded-xl font-black uppercase text-[10px] tracking-widest h-10">
                  Manage Shipments
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Snapshot */}
          <div className="space-y-4">
             <h2 className="text-xl font-black text-[#0A0D14] flex items-center gap-2">
              <Box className="h-5 w-5 text-amber-600" /> Inventory
            </h2>
            <Card className="border-slate-100 shadow-lg">
              <CardContent className="p-4 space-y-4">
                {[
                  { name: "Semaglutide 0.25mg", stock: 12, total: 100, status: "Low Stock" },
                  { name: "Sildenafil 50mg", stock: 88, total: 100, status: "Healthy" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-black text-[#0A0D14]">{item.name}</p>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                        item.stock < 20 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                        {item.status}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", item.stock < 20 ? "bg-red-500" : "bg-emerald-500")}
                        style={{ width: `${(item.stock / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
