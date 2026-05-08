import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ShoppingCart, CreditCard, DollarSign, Calendar, ChevronDown, RefreshCw, Info,
  Activity, ShieldAlert, HeartPulse, Stethoscope, Clock, Zap, Map, FileText, TrendingUp
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from "recharts";
import { useAuthStore } from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";

export function AdminDashboard() {
  const user = useAuthStore(state => state.user);
  const adminName = user?.user_metadata?.first_name || "System Admin";
  
  const [orders, setOrders] = useState<any[]>([]);

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
  
  // Theme constants to match the design
  const theme = {
    bg: "bg-[#0b120f]", // Main background
    card: "bg-[#111915]", // Card background
    border: "border-[#1b2620]", // Card borders
    textMain: "text-[#e2e8f0]", // Main white text
    textMuted: "text-[#7f9488]", // Muted gray-green text
    textGreen: "text-[#22c55e]", // Bright green text
    textBeige: "text-[#d4c4a8]", // Beige text
    textRed: "text-[#ef4444]", // Red text
    accentGreen: "bg-[#22c55e]", // Solid green background for buttons
    accentGreenDim: "bg-[#14261d]", // Dim green background for active elements
    accentBeige: "bg-[#d4c4a8]",
    accentRed: "bg-[#451a1a]",
    accentRedDim: "bg-[#2d1212]",
  };

  const revenueData = [
    { name: 'Mon', value: 4000 }, { name: 'Tue', value: 3000 }, { name: 'Wed', value: 5000 },
    { name: 'Thu', value: 4500 }, { name: 'Fri', value: 6000 }, { name: 'Sat', value: 5500 },
    { name: 'Sun', value: 7000 }, { name: 'Mon2', value: 5000 }, { name: 'Tue2', value: 4000 },
    { name: 'Wed2', value: 6000 }, { name: 'Thu2', value: 5500 }, { name: 'Fri2', value: 8000 }
  ];

  const inferenceData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    value: Math.floor(Math.random() * 100) + 20
  }));

  const sepsisData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    value: Math.floor(Math.random() * 10)
  }));

  return (
    <div className={`min-h-screen ${theme.bg} p-6 font-sans antialiased text-white rounded-tl-3xl shadow-inner -m-4 md:-m-8 md:p-8 animate-in fade-in`}>
      
      {/* Top Status Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1b2620]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#22c55e] uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
            </span>
            LIVE - REFRESHES EVERY 5S
          </div>
          <span className="text-[10px] text-[#4f6458]">Last update {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Top Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {[
          { label: "TOTAL PATIENTS", value: "6", rightValue: "9", rightLabel: "TODAY", type: "normal" },
          { label: "ADMISSIONS", value: "9", rightValue: "3", rightLabel: "TODAY", type: "normal" },
          { label: "OPEN BILLS", value: "2", sub: "$2,605", type: "red" },
          { label: "AI CRITICAL TRIAGES", value: "1", rightValue: "4", rightLabel: "SINCE 8AM", type: "normal" },
          { label: "OPEN SECURITY EVENTS", value: "0", type: "normal" },
          { label: "REVENUE - TODAY", value: "$24.6K", type: "green" },
        ].map((stat, i) => (
          <div key={i} className={`${theme.card} ${theme.border} border rounded-xl p-4 flex flex-col justify-between hover:bg-[#15201b] transition-colors`}>
            <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted}`}>{stat.label}</span>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-2xl font-normal ${theme.textMain}`}>{stat.value}</span>
              {stat.rightValue && (
                <div className="text-right">
                  <div className={`text-sm ${theme.textMain}`}>{stat.rightValue}</div>
                  <div className={`text-[8px] uppercase ${theme.textMuted}`}>{stat.rightLabel}</div>
                </div>
              )}
            </div>
            {stat.sub && <span className="text-sm text-[#ef4444] mt-1 font-medium">{stat.sub}</span>}
          </div>
        ))}
      </div>

      {/* Welcome Banner */}
      <div className="mb-6">
        <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>COMMAND CENTER - LIVE</span>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-light text-white tracking-tight">
              Welcome back, <span className="text-[#22c55e] font-medium">{adminName}</span>
            </h1>
            <p className="text-xs text-[#7f9488] mt-2 max-w-2xl leading-relaxed">
              Real-time pulse of every facility, patient, model, and dollar. Status: 4 facilities online • 1,258 staff on duty • 14 AI models live.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className={`${theme.accentGreen} text-black font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#1ea951] transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]`}>
              <Activity size={14} /> Open Operations
            </button>
            <button className={`${theme.card} ${theme.border} border text-white font-medium text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#1a251e] transition-colors`}>
              <Zap size={14} /> ModelOps
            </button>
            <button className={`${theme.card} ${theme.border} border text-white font-medium text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#1a251e] transition-colors`}>
              <ShieldAlert size={14} /> Security
            </button>
          </div>
        </div>
      </div>

      {/* Triage Banner */}
      <div className={`mb-6 rounded-xl border border-[#451a1a] ${theme.accentRedDim} p-4 flex items-center justify-between`}>
        <div className="flex items-start gap-4">
          <div className="mt-1 bg-[#ef4444]/20 p-2 rounded-full">
            <HeartPulse className="text-[#ef4444]" size={16} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-white">10 patient requests awaiting triage</h3>
              <span className="bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">2 Emergency</span>
              <span className="bg-[#f59e0b] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">3 Urgent</span>
            </div>
            <p className="text-xs text-[#ef4444]/80 mt-1">Patients submit a description of their problem, which assigns the appropriate doctor. Oldest waiting: 300m.</p>
          </div>
        </div>
        <button className={`${theme.accentGreen} text-black font-semibold text-xs px-4 py-2 rounded-lg hover:bg-[#1ea951] transition-colors`}>
          Open triage queue →
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Column (Admissions & Occupancy) */}
        <div className="col-span-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`${theme.card} ${theme.border} border rounded-xl p-4`}>
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>ACTIVE ADMISSIONS</span>
              <div className="text-3xl font-light text-white mt-2">412</div>
              <div className="text-[10px] text-[#22c55e] mt-1 flex items-center gap-1">
                <TrendingUp size={10} /> 22% vs 7-day avg
              </div>
            </div>
            <div className={`${theme.card} ${theme.border} border rounded-xl p-4`}>
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>BED OCCUPANCY</span>
              <div className="text-3xl font-light text-white mt-2">86%</div>
              <div className="text-[10px] text-[#7f9488] mt-1">Forecast +2% next 4h</div>
            </div>
          </div>

          <div className={`${theme.card} ${theme.border} border rounded-xl p-4 h-48 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>Active admissions - 7d</span>
              <span className="bg-[#14261d] text-[#22c55e] text-[10px] font-bold px-2 py-0.5 rounded">↑ 3.1%</span>
            </div>
            <div className="text-2xl font-light text-white mb-2">412 <span className="text-[10px] text-[#7f9488] ml-1">Across 4 facilities</span></div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorGreen)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${theme.card} ${theme.border} border rounded-xl p-4 h-48`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>Bed occupancy by ward</span>
              <span className="text-[10px] text-[#22c55e] cursor-pointer hover:underline">Open Map →</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'ICU 5', value: 98, total: '14/15' },
                { name: 'Cardiology 3A', value: 88, total: '21/24' },
                { name: 'Emergency Bay', value: 95, total: '19/20' },
                { name: 'Neuro 4A', value: 62, total: '11/18' },
              ].map(ward => (
                <div key={ward.name}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white">{ward.name}</span>
                    <span className="text-[#7f9488]">{ward.total} <span className="text-white ml-2">{ward.value}%</span></span>
                  </div>
                  <div className="h-1 bg-[#1b2620] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${ward.value}%`, backgroundColor: ward.value > 90 ? '#ef4444' : ward.value > 80 ? '#f59e0b' : '#22c55e' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column (AI & Ops) */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className={`${theme.card} ${theme.border} border rounded-xl p-4`}>
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>ED WAIT TIME</span>
              <div className="text-3xl font-light text-white mt-2">14 min</div>
              <div className="text-[10px] text-[#7f9488] mt-1">Median, last hour</div>
            </div>
            <div className={`${theme.card} ${theme.border} border rounded-xl p-4`}>
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>AI CRITICAL TRIAGES</span>
              <div className="text-3xl font-light text-white mt-2">27</div>
              <div className="text-[10px] text-[#22c55e] mt-1">84% AI cleared</div>
            </div>
            <div className={`${theme.card} border-[#451a1a] border rounded-xl p-4 bg-[#1a1111]`}>
              <span className={`text-[10px] font-bold tracking-wider text-[#ef4444] uppercase`}>OPEN SECURITY EVENTS</span>
              <div className="text-3xl font-light text-white mt-2">3</div>
              <div className="text-[10px] text-[#ef4444]/80 mt-1">1 critical • 2 high</div>
            </div>
          </div>

          <div className={`${theme.card} ${theme.border} border rounded-xl p-4 h-48 flex flex-col`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>AI Inferences - 24h</span>
              <span className="text-[10px] text-[#22c55e] font-bold">5 live</span>
            </div>
            <span className="text-[10px] text-[#7f9488] mb-4">Across all five models</span>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inferenceData}>
                  <Bar dataKey="value" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${theme.card} ${theme.border} border rounded-xl p-4 h-48 flex flex-col`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>Sepsis alerts - 24h</span>
              <span className="bg-[#f59e0b]/20 text-[#f59e0b] text-[10px] font-bold px-2 py-0.5 rounded">3 alerts</span>
            </div>
            <span className="text-[10px] text-[#7f9488] mb-4">By hour</span>
            <div className="flex-1 w-full flex items-end gap-1">
              {sepsisData.map((d, i) => (
                <div key={i} className="flex-1 bg-[#f59e0b] rounded-t-sm" style={{ height: `${Math.max(5, d.value * 10)}%` }}></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#1b2620]">
              <div>
                <div className="text-[10px] text-[#7f9488]">Total Alerts</div>
                <div className="text-sm text-white">94%</div>
              </div>
              <div>
                <div className="text-[10px] text-[#7f9488]">Median lead time</div>
                <div className="text-sm text-white">2.4h</div>
              </div>
              <div>
                <div className="text-[10px] text-[#7f9488]">RRT activations</div>
                <div className="text-sm text-white">7</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Finance & Performance) */}
        <div className="col-span-1 space-y-6">
          <div className={`${theme.card} ${theme.border} border rounded-xl p-4`}>
            <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>REVENUE - TODAY</span>
            <div className="text-3xl font-light text-white mt-2">$2,480,000</div>
            <div className="text-[10px] text-[#7f9488] mt-1">Collected $1,856,000</div>
          </div>

          <div className={`${theme.card} ${theme.border} border rounded-xl p-4 h-48 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>Revenue - last 14d (M USD)</span>
              <span className="bg-[#14261d] text-[#22c55e] text-[10px] font-bold px-2 py-0.5 rounded">+12% WoW</span>
            </div>
            <div className="text-2xl font-light text-white mb-2">$27.6M <span className="text-[10px] text-[#7f9488] ml-1">Smart contract actions handled 73%</span></div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorGreen2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorGreen2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${theme.card} ${theme.border} border rounded-xl p-4 h-48 flex flex-col`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold tracking-wider ${theme.textMuted} uppercase`}>Patient throughput - 5x24</span>
            </div>
            <span className="text-[10px] text-[#7f9488] mb-4">ED arrivals heatmap. Dark is busy = 24h</span>
            <div className="flex-1 w-full grid grid-cols-5 gap-1">
               {Array.from({ length: 5 }).map((_, col) => (
                 <div key={col} className="grid grid-rows-12 gap-px">
                   {Array.from({ length: 12 }).map((_, row) => {
                     const intensity = Math.random();
                     return (
                       <div key={row} className="rounded-[1px]" style={{ backgroundColor: `rgba(34, 197, 94, ${0.1 + intensity * 0.9})` }}></div>
                     );
                   })}
                 </div>
               ))}
            </div>
            <div className="flex justify-between text-[8px] text-[#7f9488] mt-2">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
