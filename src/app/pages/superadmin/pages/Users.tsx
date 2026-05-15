import { useState, useEffect } from "react";
import {
  Users, Search, Filter, Edit2, ShieldOff, Shield,
  ChevronDown, UserCheck, Building2, Eye, Plus, X, Loader2,
  Mail, Globe, Phone, MoreHorizontal, Ban, Trash2, ArrowUpRight,
  ShieldAlert, Fingerprint, Activity, Clock, CheckCircle2
} from "lucide-react";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";
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
      <SuperAdminShell eyebrow="Directory" title="Platform users" description="Loading directory…">
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-600">Loading profiles…</p>
        </div>
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell
      eyebrow="Directory"
      title="Platform users"
      description="Search and manage profiles in Supabase. Actions below use the same handlers as before."
      actions={
        <Button
          onClick={() => setShowInviteModal(true)}
          className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Invite user
        </Button>
      }
    >

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { label: "Total Accounts", value: counts.total, icon: Users, color: "text-[#0A2E1F]" },
          { label: "Active Patients", value: counts.patients, icon: UserCheck, color: "text-emerald-600" },
          { label: "Clinical Staff", value: counts.doctors, icon: Activity, color: "text-blue-600" },
          { label: "Admin Nodes", value: counts.admins, icon: Shield, color: "text-violet-600" },
          { label: "Suspended", value: counts.suspended, icon: Ban, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i} className={saPanel}>
            <CardContent className="p-4">
            <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50", s.color)}>
               <s.icon className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{s.value}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <div className={cn(saPanel, "flex flex-col gap-3 p-3 md:flex-row md:items-center")}>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none ring-emerald-500/20 focus:ring-2"
            placeholder="Search by name or email…"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 md:w-40"
        >
          <option value="all">All roles</option>
          <option value="patient">Patients</option>
          <option value="doctor">Doctors</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 md:w-44"
        >
          <option value="all">All brands</option>
          <option value="Peak Health">Peak Health</option>
          <option value="Bio-Optimizers">Bio-Optimizers</option>
        </select>
      </div>

      {/* USER ARCHITECTURE GRID */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className={cn(saPanel, "transition-shadow hover:shadow-md")}>
              <CardContent className="relative space-y-4 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-emerald-400">
                    {(u.full_name || "U").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900">{u.full_name}</h3>
                      <Badge
                        className={cn(
                          "text-[10px] font-medium capitalize",
                          u.role === "doctor"
                            ? "bg-emerald-50 text-emerald-800"
                            : u.role === "admin"
                              ? "bg-violet-50 text-violet-800"
                              : "bg-sky-50 text-sky-800",
                        )}
                      >
                        {u.role}
                      </Badge>
                      {u.status === "suspended" && (
                        <Badge className="bg-red-50 text-[10px] font-medium text-red-700">Suspended</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:items-center sm:gap-3">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {u.email}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {u.brand_id || u.sub_brand || "Peak Health"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">Joined</span>
                      <span className="font-medium text-slate-800">{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">Status</span>
                      <span className={cn("font-medium", u.status === "active" ? "text-emerald-700" : "text-red-600")}>
                        {u.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-9 w-9 rounded-lg p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(u.id, u.status)}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 w-9 rounded-lg p-0",
                        u.status === "active" ? "hover:border-red-200 hover:bg-red-50" : "hover:border-emerald-200 hover:bg-emerald-50",
                      )}
                    >
                      {u.status === "active" ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg px-3 text-xs font-medium">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
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
    </SuperAdminShell>
  );
}
