import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ShoppingCart, CreditCard, DollarSign, Calendar, ChevronDown, RefreshCw, Info,
  Activity, ShieldAlert, HeartPulse, Stethoscope, Clock, Zap, Map, FileText, TrendingUp,
  Search, Bell, Command, Settings, ChevronRight, Globe, Layers, BarChart3, Database
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid 
} from "recharts";
import { Badge } from "../../components/ui/shared.tsx";
import { useAuthStore } from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";

export function AdminDashboard() {
  const user = useAuthStore(state => state.user);
  const adminName = user?.user_metadata?.first_name || "System Admin";
  
  const [orders, setOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const { data, error } = await supabase.from('orders').select('*');
        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchOrders();
  }, []);
  
  const theme = {
    bg: "bg-[#060807]", 
    card: "bg-[#0c120f]/80", 
    cardSolid: "bg-[#0c120f]",
    border: "border-[#1a2620]", 
    textMain: "text-[#e2e8f0]", 
    textMuted: "text-[#7f9488]", 
    textGreen: "text-[#22c55e]", 
    textBeige: "text-[#d4c4a8]", 
    textRed: "text-[#ef4444]", 
    accentGreen: "bg-[#22c55e]", 
    accentGreenDim: "bg-[#14261d]", 
    accentBeige: "bg-[#d4c4a8]",
    accentBeigeDim: "bg-[#2d2a24]",
    accentRed: "bg-[#ef4444]",
    accentRedDim: "bg-[#2d1212]",
  };

  const revenueData = [
    { name: 'Mon', value: 4000 }, { name: 'Tue', value: 3000 }, { name: 'Wed', value: 5000 },
    { name: 'Thu', value: 4500 }, { name: 'Fri', value: 6000 }, { name: 'Sat', value: 5500 },
    { name: 'Sun', value: 7000 }, { name: 'M2', value: 5000 }, { name: 'T2', value: 4000 },
    { name: 'W2', value: 6000 }, { name: 'T2', value: 5500 }, { name: 'F2', value: 8000 }
  ];

  const inferenceData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    value: Math.floor(Math.random() * 100) + 20
  }));

  return (
    <div className={`min-h-screen ${theme.bg} p-4 md:p-6 lg:p-8 font-sans antialiased text-white rounded-tl-[2rem] shadow-[inset_0_2px_40px_rgba(0,0,0,0.8)] -m-4 md:-m-8 animate-in fade-in duration-700`}>
      
      {/* COMMAND HEADER BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <Layers className="h-5 w-5 text-[#22c55e]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[#d4c4a8]">Peak Health</h2>
              <span className="text-[10px] bg-[#1a2620] text-[#7f9488] px-2 py-0.5 rounded-full border border-[#1b2620]">Admin v2.4.0</span>
            </div>
            <p className="text-[10px] text-[#4f6458] font-medium tracking-wider uppercase mt-0.5">Global Command Center</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4f6458] group-focus-within:text-[#22c55e] transition-colors" />
            <input 
              type="text" 
              placeholder="Intent: 'Show ICU 5 occupancy now' or search..."
              className="w-full bg-[#0c120f] border border-[#1a2620] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[#e2e8f0] focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/20 transition-all placeholder:text-[#3a4d42]"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[10px] font-bold text-[#3a4d42] border border-[#1a2620] px-1.5 py-0.5 rounded-md">⌘</span>
              <span className="text-[10px] font-bold text-[#3a4d42] border border-[#1a2620] px-1.5 py-0.5 rounded-md">K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#0c120f] rounded-xl p-1 border border-[#1a2620]">
            <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#22c55e] bg-[#14261d]">LIVE</button>
            <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#7f9488] hover:text-white transition-colors">HISTORY</button>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0c120f] border border-[#1a2620] flex items-center justify-center relative cursor-pointer hover:bg-[#15201b] transition-colors group">
            <Bell className="h-5 w-5 text-[#7f9488] group-hover:text-[#22c55e]" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-[#ef4444] rounded-full border-2 border-[#060807]"></span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0c120f] border border-[#1a2620] flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform border-[#d4c4a8]/30">
             <div className="h-full w-full bg-gradient-to-br from-[#d4c4a8] to-[#9c8e76] flex items-center justify-center text-black font-black text-xs">
               {adminName.charAt(0)}
             </div>
          </div>
        </div>
      </div>

      {/* TOP METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        {[
          { label: "TOTAL PATIENTS", value: "6", status: "LIVE", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
          { label: "TOTAL DOCTORS", value: "9", status: "STABLE", color: "text-[#22c55e]", bg: "bg-[#22c55e]/5" },
          { label: "VISITS TODAY", value: "2", status: "INCREASING", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
          { label: "IN PROGRESS", value: "1", status: "CRITICAL", color: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
          { label: "COMPLETED TODAY", value: "0", status: "PENDING", color: "text-[#7f9488]", bg: "bg-white/5" },
          { label: "ADMITTED", value: "1", status: "ACTIVE", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
          { label: "OPEN BILLS", value: "3", status: "ACTION REQ", color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", sub: "$2,605" },
          { label: "DOCTORS AVAILABLE", value: "6", status: "READY", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
        ].map((stat, i) => (
          <div key={i} className={`${theme.card} ${theme.border} border rounded-2xl p-4 flex flex-col justify-between hover:border-[#22c55e]/30 transition-all group cursor-default hover:shadow-[0_10px_30px_rgba(34,197,94,0.05)]`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black tracking-widest text-[#4f6458] uppercase">{stat.label}</span>
                <div className={`h-1.5 w-1.5 rounded-full ${stat.color} animate-pulse`}></div>
              </div>
              <div className="text-2xl font-light text-white group-hover:text-[#22c55e] transition-colors">{stat.value}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#1a2620] flex items-center justify-between">
              <span className={`text-[8px] font-black ${stat.color} tracking-tighter`}>{stat.status}</span>
              {stat.sub && <span className="text-[10px] font-bold text-[#ef4444]">{stat.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - COMMAND & TRIAGE */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* WELCOME SECTION */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#22c55e]/20 to-[#d4c4a8]/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className={`relative ${theme.cardSolid} ${theme.border} border rounded-3xl p-8 overflow-hidden`}>
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Command size={120} className="text-[#22c55e]" />
               </div>
               
               <div className="flex items-center gap-3 mb-4">
                 <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#22c55e] uppercase bg-[#22c55e]/10 px-3 py-1 rounded-full border border-[#22c55e]/20">
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
                   </span>
                   SYSTEM ACTIVE
                 </div>
                 <span className="text-[10px] text-[#4f6458] font-bold">{currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}</span>
               </div>

               <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white leading-tight">
                 Welcome back, <span className="text-[#22c55e] font-medium drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">{adminName}</span>
               </h1>
               <p className="text-base text-[#7f9488] mt-4 max-w-2xl leading-relaxed">
                 Real-time pulse of every facility, patient, model, and dollar. Status: <span className="text-[#d4c4a8]">4 facilities online</span> • <span className="text-[#d4c4a8]">1,258 staff on duty</span> • <span className="text-[#d4c4a8]">14 AI models live</span>.
               </p>

               <div className="flex flex-wrap items-center gap-4 mt-8">
                 <button className="bg-[#22c55e] text-black font-black text-xs px-8 py-3.5 rounded-xl flex items-center gap-2 hover:bg-[#1ea951] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_25px_rgba(34,197,94,0.25)]">
                   <Activity size={16} /> OPEN OPERATIONS
                 </button>
                 <button className="bg-[#1a2620] border border-[#22c55e]/30 text-white font-bold text-xs px-6 py-3.5 rounded-xl flex items-center gap-2 hover:bg-[#22c55e]/10 transition-all">
                   <Zap size={16} className="text-[#22c55e]" /> MODELOPS
                 </button>
                 <button className="bg-[#1a2620] border border-[#d4c4a8]/30 text-white font-bold text-xs px-6 py-3.5 rounded-xl flex items-center gap-2 hover:bg-[#d4c4a8]/10 transition-all">
                   <ShieldAlert size={16} className="text-[#d4c4a8]" /> SECURITY
                 </button>
               </div>
            </div>
          </div>

          {/* TRIAGE ACTION BAR */}
          <div className={`rounded-3xl border border-[#ef4444]/30 bg-gradient-to-r from-[#2d1212] to-[#1a0a0a] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-red-950/10`}>
            <div className="flex items-start gap-5">
              <div className="bg-[#ef4444]/10 p-4 rounded-2xl border border-[#ef4444]/20">
                <HeartPulse className="text-[#ef4444] animate-pulse" size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-white tracking-tight">10 patient requests awaiting triage</h3>
                  <div className="flex gap-2">
                    <span className="bg-[#ef4444] text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-md shadow-red-500/20">2 Emergency</span>
                    <span className="bg-[#f59e0b] text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-md shadow-amber-500/20">3 Urgent</span>
                  </div>
                </div>
                <p className="text-xs text-[#ef4444]/70 mt-1 font-medium italic">"Critical wait time threshold exceeded in Brand B portal (300m+)"</p>
              </div>
            </div>
            <button className="w-full md:w-auto bg-[#ef4444] text-white font-black text-xs px-8 py-4 rounded-2xl hover:bg-[#dc2626] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/20 whitespace-nowrap">
              OPEN TRIAGE QUEUE →
            </button>
          </div>

          {/* MAIN CHARTS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`${theme.cardSolid} ${theme.border} border rounded-3xl p-6 h-[400px] flex flex-col`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[9px] font-black tracking-[0.2em] text-[#4f6458] uppercase block mb-1">AI INFRASTRUCTURE</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">AI Inferences - 24h</h3>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1 rounded-full border border-[#0ea5e9]/20">
                  <BarChart3 size={12} />
                  <span className="text-[10px] font-black">5 MODELS LIVE</span>
                </div>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inferenceData}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a2620" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: '#1a2620'}}
                      contentStyle={{backgroundColor: '#0c120f', border: '1px solid #1a2620', borderRadius: '12px', fontSize: '10px'}}
                    />
                    <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-[#1a2620] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#0ea5e9]"></div>
                  <span className="text-[10px] font-bold text-[#7f9488]">Peak Load: 17:00 (122 req/s)</span>
                </div>
                <ChevronRight size={14} className="text-[#4f6458]" />
              </div>
            </div>

            <div className={`${theme.cardSolid} ${theme.border} border rounded-3xl p-6 h-[400px] flex flex-col`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[9px] font-black tracking-[0.2em] text-[#4f6458] uppercase block mb-1">REVENUE STREAM</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Financial Performance</h3>
                </div>
                <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30 px-3 py-1">+14% WoW</Badge>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a2620" />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#0c120f', border: '1px solid #1a2620', borderRadius: '12px'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-[#1a2620]">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-[10px] font-bold text-[#7f9488]">SMART CONTRACT SETTLEMENTS</span>
                   <span className="text-[10px] font-bold text-white">73.4%</span>
                 </div>
                 <div className="h-1.5 w-full bg-[#1a2620] rounded-full overflow-hidden">
                   <div className="h-full bg-[#22c55e] rounded-full" style={{width: '73.4%'}}></div>
                 </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - PERFORMANCE & HEATMAPS */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* PERFORMANCE CARDS */}
          <div className="grid grid-cols-2 gap-4">
             <div className={`${theme.cardSolid} ${theme.border} border rounded-2xl p-5 hover:border-[#d4c4a8]/30 transition-colors`}>
               <span className="text-[8px] font-black tracking-widest text-[#4f6458] uppercase block mb-3">ED WAIT TIME</span>
               <div className="text-3xl font-light text-white mb-1">14 <span className="text-sm font-bold text-[#d4c4a8]">min</span></div>
               <p className="text-[9px] text-[#7f9488] font-medium leading-tight mt-2">Median response time across all brands.</p>
             </div>
             <div className={`${theme.cardSolid} ${theme.border} border rounded-2xl p-5 hover:border-[#22c55e]/30 transition-colors`}>
               <span className="text-[8px] font-black tracking-widest text-[#4f6458] uppercase block mb-3">ADMISSIONS</span>
               <div className="text-3xl font-light text-white mb-1">412</div>
               <div className="flex items-center gap-1 text-[9px] text-[#22c55e] font-bold mt-2">
                 <TrendingUp size={10} /> +22%
               </div>
             </div>
          </div>

          <div className={`${theme.cardSolid} ${theme.border} border rounded-3xl p-6`}>
             <div className="flex items-center justify-between mb-6">
                <span className="text-[9px] font-black tracking-[0.2em] text-[#4f6458] uppercase">Bed Occupancy</span>
                <span className="text-[10px] font-black text-[#d4c4a8] cursor-pointer hover:underline">OPEN MAP →</span>
             </div>
             <div className="space-y-5">
                {[
                  { name: 'ICU 5 PORTAL', value: 98, total: '14/15', color: '#ef4444' },
                  { name: 'CARDIOLOGY HUB', value: 88, total: '21/24', color: '#f59e0b' },
                  { name: 'EMERGENCY BAY', value: 95, total: '19/20', color: '#ef4444' },
                  { name: 'NEURO VIRTUAL', value: 62, total: '11/18', color: '#22c55e' },
                ].map((ward, i) => (
                  <div key={i} className="group cursor-default">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[10px] font-black text-white group-hover:text-[#22c55e] transition-colors">{ward.name}</p>
                        <p className="text-[9px] text-[#4f6458] font-bold">{ward.total} UNIT LOAD</p>
                      </div>
                      <span className="text-sm font-bold text-white">{ward.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1a2620] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${ward.value}%`, backgroundColor: ward.color }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* REVENUE OVERVIEW */}
          <div className={`${theme.cardSolid} border-[#d4c4a8]/20 border rounded-3xl p-6 bg-gradient-to-br from-[#0c120f] to-[#1a1c1a]`}>
             <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black tracking-[0.2em] text-[#4f6458] uppercase">Revenue - Today</span>
                <DollarSign size={16} className="text-[#d4c4a8]" />
             </div>
             <div className="text-4xl font-light text-white tracking-tight mb-1">$2,480,000</div>
             <div className="flex items-center gap-2 text-[10px] text-[#7f9488] font-bold mb-6">
                <span className="text-[#22c55e]">+$142K</span> from yesterday
             </div>
             <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#4f6458] font-bold uppercase">COLLECTED</span>
                  <span className="text-xs font-bold text-[#d4c4a8]">$1,856,000</span>
                </div>
                <div className="h-1 w-full bg-[#1a2620] rounded-full overflow-hidden">
                  <div className="h-full bg-[#d4c4a8] rounded-full" style={{width: '74%'}}></div>
                </div>
             </div>
          </div>

          {/* THROUGHPUT HEATMAP */}
          <div className={`${theme.cardSolid} ${theme.border} border rounded-3xl p-6`}>
             <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black tracking-[0.2em] text-[#4f6458] uppercase">Patient Throughput</span>
                <Badge className="bg-[#d4c4a8]/10 text-[#d4c4a8] border-[#d4c4a8]/20 text-[8px]">5x24 HEATMAP</Badge>
             </div>
             <p className="text-[9px] text-[#4f6458] font-bold mb-6 uppercase tracking-wider">Busy cycles detection active</p>
             
             <div className="h-32 w-full grid grid-cols-5 gap-1.5">
               {Array.from({ length: 5 }).map((_, col) => (
                 <div key={col} className="grid grid-rows-12 gap-1">
                   {Array.from({ length: 12 }).map((_, row) => {
                     const intensity = Math.random();
                     return (
                       <div 
                        key={row} 
                        className="rounded-sm transition-all hover:scale-110 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] cursor-pointer" 
                        style={{ backgroundColor: intensity > 0.8 ? '#22c55e' : intensity > 0.5 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.1)' }}
                       ></div>
                     );
                   })}
                 </div>
               ))}
             </div>
             <div className="flex justify-between text-[8px] text-[#4f6458] font-black mt-4 uppercase tracking-[0.2em]">
                <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span>
             </div>
          </div>

        </div>

      </div>

      {/* FOOTER SYSTEM STATUS */}
      <div className="mt-12 pt-6 border-t border-[#1a2620] flex flex-col md:flex-row items-center justify-between gap-4 text-[#4f6458]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Database size={12} />
            <span className="text-[9px] font-bold tracking-widest uppercase">PostgreSQL: 12ms (OPTIMAL)</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={12} />
            <span className="text-[9px] font-bold tracking-widest uppercase">CDN: CLOUDFLARE EDGE (ACTIVE)</span>
          </div>
        </div>
        <div className="text-[9px] font-black tracking-[0.3em] uppercase">
          Peak Health Enterprise Architecture © 2026
        </div>
      </div>

    </div>
  );
}
