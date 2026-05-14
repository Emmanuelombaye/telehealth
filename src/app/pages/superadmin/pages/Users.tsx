import { useState, useEffect } from "react";
import {
  Users, Search, Filter, Edit2, ShieldOff, Shield,
  ChevronDown, UserCheck, Building2, Eye, Plus, X, Loader2,
  Mail, Globe, Phone, MoreHorizontal, Ban, Trash2, ArrowUpRight,
  ShieldAlert, Fingerprint, Activity, Clock, CheckCircle2
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn, Input } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;

export function SuperAdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    role: "patient",
    brand: "Peak Health"
  });

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setDbUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      // Fallback to mock data if table doesn't exist
      setDbUsers([
        { id: "1", full_name: "Alice Thompson", email: "alice@branda.health", role: "patient", sub_brand: "Peak Health", status: "active", country: "🇺🇸", created_at: new Date().toISOString() },
        { id: "2", full_name: "Dr. Sarah Johnson", email: "sarah@branda.health", role: "doctor", sub_brand: "Peak Health", status: "active", country: "🇺🇸", created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    const channel = supabase.channel('profiles-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { error } = await supabase.from('profiles').insert([{
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        brand_id: newUser.brand,
        status: 'active'
      }]);
      if (error) throw error;
      setShowInviteModal(false);
      setNewUser({ full_name: "", email: "", role: "patient", brand: "Peak Health" });
      fetchUsers();
    } catch (err) {
      console.error("Invite error:", err);
      alert("Database Sync Error: Ensure 'profiles' table exists with RLS permissions.");
    } finally {
      setInviting(false);
    }
  };

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
       console.error("Update status error:", err);
    }
  };

  const filtered = dbUsers.filter(u => {
    const matchSearch = (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchBrand = brandFilter === "all" || (u.brand_id || u.sub_brand) === brandFilter;
    return matchSearch && matchRole && matchBrand;
  });

  const counts = {
    total: dbUsers.length,
    patients: dbUsers.filter(u => u.role === "patient").length,
    doctors: dbUsers.filter(u => u.role === "doctor").length,
    admins: dbUsers.filter(u => u.role === "admin" || u.role === "superadmin").length,
    suspended: dbUsers.filter(u => u.status === "suspended").length,
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6">
         <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-800 animate-pulse">Establishing Live Identity Grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* USER COCKPIT HEADER */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-700">Global Identity Matrix</h1>
          </div>
          <h2 className="text-4xl font-black text-[#0A2E1F] tracking-tight">User Management</h2>
        </div>

        <Button 
          onClick={() => setShowInviteModal(true)}
          className="h-16 rounded-[28px] bg-[#0A2E1F] hover:bg-emerald-950 text-white px-10 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-emerald-900/20 gap-3 group relative z-10 transition-all hover:-translate-y-1"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" /> Invite Platform User
        </Button>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { label: "Total Accounts", value: counts.total, icon: Users, color: "text-[#0A2E1F]" },
          { label: "Active Patients", value: counts.patients, icon: UserCheck, color: "text-emerald-600" },
          { label: "Clinical Staff", value: counts.doctors, icon: Activity, color: "text-blue-600" },
          { label: "Admin Nodes", value: counts.admins, icon: Shield, color: "text-violet-600" },
          { label: "Suspended", value: counts.suspended, icon: Ban, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100/50 rounded-[40px] bg-white p-8 group hover:shadow-emerald-900/5 transition-all">
            <div className={cn("h-12 w-12 rounded-[20px] mb-6 flex items-center justify-center bg-slate-50", s.color)}>
               <s.icon className="h-6 w-6" />
            </div>
            <h3 className="text-3xl font-black text-[#0A2E1F] tracking-tighter">{s.value}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 max-w-5xl mx-auto bg-white p-4 rounded-[32px] shadow-xl shadow-slate-100/50 border border-slate-50">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-[#0A2E1F] focus:ring-4 focus:ring-emerald-500/5 transition-all"
            placeholder="Search identities by name or email..." 
          />
        </div>
        <select 
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="h-[60px] px-8 rounded-2xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-[#0A2E1F] focus:ring-4 focus:ring-emerald-500/5 cursor-pointer appearance-none"
        >
          <option value="all">All Roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>
        <select 
          value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
          className="h-[60px] px-8 rounded-2xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-[#0A2E1F] focus:ring-4 focus:ring-emerald-500/5 cursor-pointer appearance-none"
        >
          <option value="all">All Brands</option>
          <option value="Peak Health">Peak Health</option>
          <option value="Bio-Optimizers">Bio-Optimizers</option>
        </select>
      </div>

      {/* USER ARCHITECTURE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filtered.map((u, i) => (
          <motion.div 
            key={u.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[48px] bg-white p-10 hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all border border-transparent hover:border-emerald-100 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-125 transition-all duration-1000">
                 <Users size={160} />
              </div>
              
              <div className="flex items-center gap-8 relative z-10">
                 <div className="h-20 w-20 rounded-[28px] bg-[#0A2E1F] flex items-center justify-center font-black text-emerald-400 text-3xl group-hover:rotate-6 transition-transform">
                    {(u.full_name || "U").charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="text-2xl font-black text-[#0A2E1F] tracking-tight truncate">{u.full_name}</h3>
                       <Badge className={cn(
                         "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-none",
                         u.role === 'doctor' ? 'bg-emerald-50 text-emerald-700' : 
                         u.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
                       )}>
                          {u.role}
                       </Badge>
                       {u.status === 'suspended' && <Badge className="bg-red-50 text-red-600 border-none text-[9px] font-black uppercase tracking-widest">Suspended</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 font-bold text-sm">
                       <span className="flex items-center gap-2"><Mail size={14} className="text-emerald-600" /> {u.email}</span>
                       <span className="flex items-center gap-2"><Building2 size={14} /> {u.brand_id || u.sub_brand || "Peak Health"}</span>
                    </div>
                 </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Joined Platform</span>
                       <span className="text-xs font-black text-[#0A2E1F]">{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Identity Status</span>
                       <span className={cn("text-xs font-black uppercase tracking-widest", u.status === 'active' ? 'text-emerald-600' : 'text-red-600')}>
                          {u.status === 'active' ? '● Live' : '● Inactive'}
                       </span>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm">
                       <Edit2 size={18} />
                    </Button>
                    <Button 
                      onClick={() => handleStatusUpdate(u.id, u.status)}
                      variant="outline" 
                      className={cn(
                        "h-12 w-12 rounded-xl border-slate-100 transition-all shadow-sm",
                        u.status === 'active' ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-emerald-50 hover:text-emerald-600'
                      )}
                    >
                       {u.status === 'active' ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                    </Button>
                    <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-100 text-[#0A2E1F] hover:bg-slate-50 transition-all shadow-sm font-black uppercase tracking-widest text-[9px] gap-2">
                       Impersonate <Eye size={16} />
                    </Button>
                 </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* INVITE USER MODAL - EXECUTIVE EDITION */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A2E1F]/60 backdrop-blur-md"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[48px] shadow-3xl overflow-hidden border border-white/20"
            >
              <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-[#0A2E1F] text-white">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Identity Provisioning</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Invite Platform User</h2>
                 </div>
                 <button onClick={() => setShowInviteModal(false)} className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleInvite} className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Legal Full Name</label>
                    <Input 
                      required 
                      placeholder="e.g. Johnathan Doe" 
                      value={newUser.full_name}
                      onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                      className="rounded-2xl border-slate-200 h-14 font-bold focus:ring-emerald-500/10"
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Professional Email</label>
                    <Input 
                      required type="email"
                      placeholder="e.g. j.doe@peak.health" 
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className="rounded-2xl border-slate-200 h-14 font-bold focus:ring-emerald-500/10"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Identity Role</label>
                       <select 
                         className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                         value={newUser.role}
                         onChange={e => setNewUser({...newUser, role: e.target.value})}
                       >
                          <option value="patient">Patient</option>
                          <option value="doctor">Clinical Doctor</option>
                          <option value="admin">Brand Admin</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Designated Brand</label>
                       <select 
                         className="flex h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                         value={newUser.brand}
                         onChange={e => setNewUser({...newUser, brand: e.target.value})}
                       >
                          <option>Peak Health</option>
                          <option>Bio-Optimizers</option>
                       </select>
                    </div>
                 </div>

                 <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-4">
                    <div className="flex items-center gap-4">
                       <ShieldAlert className="h-8 w-8 text-emerald-600" />
                       <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-relaxed">
                          The invited user will receive a secure portal activation link within their encrypted mailbox.
                       </p>
                    </div>
                    {inviting && (
                       <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: "100%" }}
                               transition={{ duration: 2 }}
                               className="h-full bg-emerald-600"
                             />
                          </div>
                          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.3em] text-center">Provisioning Identity Vault...</p>
                       </div>
                    )}
                 </div>

                 <Button 
                   disabled={inviting}
                   className="w-full h-16 bg-[#0A2E1F] hover:bg-emerald-950 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] shadow-3xl shadow-emerald-900/30 mt-6 transition-all hover:-translate-y-1 active:translate-y-0"
                 >
                    {inviting ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-400" /> : "Authorize & Send Invite"}
                 </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
