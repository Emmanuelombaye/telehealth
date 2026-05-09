import { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, Edit2, ShieldOff, ShieldCheck,
  ChevronDown, Stethoscope, Plus, X, CheckCircle2, MoreHorizontal,
  Globe, Award, Clipboard, Activity, TrendingUp, Loader2
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";
import { toast } from "sonner";

type DoctorRow = {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  npi: string | null;
  credentials: string | null;
  licensed_states: string | null;
  status: 'active' | 'pending' | 'invited' | 'revoked';
  patients: number;
  avatar: string;
  source: 'profile' | 'invitation';
};

const SPECIALTIES = [
  "General Practice", "Dermatology", "Weight Loss", "Men's Health",
  "Women's Health", "Mental Health", "Endocrinology", "Sleep Medicine",
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase() || "DR";
}

export function SuperAdminDoctorsPage() {
  const user = useAuthStore(s => s.user);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Invitation form state
  const [invFullName, setInvFullName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invCalendly, setInvCalendly] = useState("");
  const [invNpi, setInvNpi] = useState("");
  const [invSpecialty, setInvSpecialty] = useState("");
  const [invCredentials, setInvCredentials] = useState("");
  const [invStates, setInvStates] = useState("");
  const [invPhotoName, setInvPhotoName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetInviteForm = () => {
    setInvFullName(""); setInvEmail(""); setInvCalendly("");
    setInvNpi(""); setInvSpecialty(""); setInvCredentials("");
    setInvStates(""); setInvPhotoName("");
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      // 1. Active doctors from profiles
      const { data: profileRows, error: pErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, first_name, last_name, specialty, npi_number, credentials, licensed_states, status, patients_count, role')
        .eq('role', 'doctor');

      // 2. Pending invitations
      const { data: inviteRows, error: iErr } = await supabase
        .from('doctor_invitations')
        .select('id, email, full_name, specialty, npi_number, credentials, licensed_states, status')
        .neq('status', 'accepted');

      const fromProfiles: DoctorRow[] = (profileRows || []).map((p: any) => {
        const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email;
        return {
          id: p.id,
          name,
          email: p.email || "",
          specialty: p.specialty,
          npi: p.npi_number,
          credentials: p.credentials,
          licensed_states: p.licensed_states,
          status: (p.status as any) || 'active',
          patients: p.patients_count || 0,
          avatar: initials(name),
          source: 'profile',
        };
      });

      const fromInvites: DoctorRow[] = (inviteRows || []).map((r: any) => ({
        id: r.id,
        name: r.full_name,
        email: r.email,
        specialty: r.specialty,
        npi: r.npi_number,
        credentials: r.credentials,
        licensed_states: r.licensed_states,
        status: 'pending',
        patients: 0,
        avatar: initials(r.full_name || r.email || "DR"),
        source: 'invitation',
      }));

      // De-dupe: if a profile already exists for an invited email, skip the invitation
      const profileEmails = new Set(fromProfiles.map(d => d.email.toLowerCase()));
      const merged = [
        ...fromProfiles,
        ...fromInvites.filter(d => !profileEmails.has(d.email.toLowerCase())),
      ];

      setDoctors(merged);
      if (pErr) console.warn('[Doctors] profiles read warning:', pErr.message);
      if (iErr) console.warn('[Doctors] invitations read warning:', iErr.message);
    } catch (err: any) {
      console.error('[Doctors] fetch failed:', err);
      toast.error("Could not load clinical network. Check your Supabase schema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.email || "").toLowerCase().includes(q) ||
      (d.specialty || "").toLowerCase().includes(q) ||
      (d.npi || "").includes(q)
    );
  }, [doctors, search]);

  const stats = useMemo(() => {
    const active = doctors.filter(d => d.status === 'active').length;
    const pending = doctors.filter(d => d.status === 'pending').length;
    const totalPatients = doctors.reduce((sum, d) => sum + (d.patients || 0), 0);
    return { active, pending, totalPatients };
  }, [doctors]);

  const handleSendInvitation = async () => {
    if (submitting) return;
    if (!invFullName.trim() || !invEmail.trim()) {
      toast.error("Full name and email are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(invEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('doctor_invitations').insert([{
        invited_by: user?.id || null,
        email: invEmail.trim().toLowerCase(),
        full_name: invFullName.trim(),
        specialty: invSpecialty || null,
        npi_number: invNpi || null,
        credentials: invCredentials || null,
        licensed_states: invStates || null,
        calendly_url: invCalendly || null,
        status: 'pending',
      }]);
      if (error) throw error;
      toast.success(`Invitation sent to ${invEmail}`);
      resetInviteForm();
      setShowInviteModal(false);
      fetchDoctors();
    } catch (err: any) {
      console.error('[Doctors] invite failed:', err);
      toast.error(err.message || "Failed to send invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (doc: DoctorRow) => {
    if (!confirm(`Revoke access for ${doc.name}?`)) return;
    try {
      if (doc.source === 'invitation') {
        const { error } = await supabase
          .from('doctor_invitations')
          .update({ status: 'revoked' })
          .eq('id', doc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'revoked' })
          .eq('id', doc.id);
        if (error) throw error;
      }
      toast.success(`${doc.name} access revoked.`);
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.message || "Could not revoke access.");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header section with Premium Feel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1a2620] pb-8">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#e2e8f0]">Clinical Network</h1>
          <p className="text-xs font-bold text-[#7f9488] uppercase tracking-[0.3em] mt-2">Global Provider Onboarding & Governance</p>
        </div>
        <Button 
          onClick={() => setShowInviteModal(true)}
          className="rounded-2xl h-14 px-8 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black uppercase italic text-xs tracking-widest gap-3 shadow-xl shadow-[#22c55e]/10 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" /> Onboard New Physician
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Providers", value: stats.active.toString(), icon: Stethoscope, color: "text-[#22c55e]", bg: "bg-[#22c55e]/5" },
          { label: "Pending Credentials", value: stats.pending.toString(), icon: Clipboard, color: "text-amber-500", bg: "bg-amber-500/5" },
          { label: "Total Patients", value: stats.totalPatients.toString(), icon: Activity, color: "text-blue-500", bg: "bg-blue-500/5" },
          { label: "Network Size", value: doctors.length.toString(), icon: Award, color: "text-emerald-400", bg: "bg-emerald-400/5" },
        ].map((s, i) => (
          <Card key={i} className={cn("border-none rounded-[2rem] overflow-hidden group hover:bg-[#1a2620]/40 transition-all", s.bg)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bg.replace('/5', '/10'))}>
                   <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
                <TrendingUp className="h-4 w-4 text-[#7f9488] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className={cn("text-3xl font-black italic tracking-tighter uppercase mb-1", s.color)}>{s.value}</p>
              <p className="text-[10px] font-black text-[#7f9488] uppercase tracking-widest">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7f9488]" />
            <input 
              type="text" 
              placeholder="SEARCH BY NAME, NPI, OR SPECIALTY..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-14 pr-6 bg-[#0c120f] border border-[#1a2620] rounded-2xl text-xs font-bold uppercase tracking-widest text-[#e2e8f0] focus:outline-none focus:border-[#22c55e]/50 transition-all placeholder:text-[#4f6458]"
            />
         </div>
         <Button variant="outline" className="h-14 w-14 rounded-2xl border-[#1a2620] bg-[#0c120f] text-[#7f9488] hover:text-[#22c55e] hover:border-[#22c55e]/30">
            <Filter className="h-5 w-5" />
         </Button>
      </div>

      {/* Doctor Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#7f9488]">
          <Loader2 className="h-6 w-6 animate-spin mr-3" />
          <span className="text-xs font-black uppercase tracking-widest">Loading clinical network...</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-none bg-[#0c120f] rounded-[2.5rem]">
          <CardContent className="p-16 text-center">
            <Stethoscope className="h-12 w-12 text-[#22c55e]/40 mx-auto mb-4" />
            <h3 className="text-lg font-black italic uppercase text-[#e2e8f0] mb-2">
              {search ? "No matching providers" : "No providers yet"}
            </h3>
            <p className="text-sm text-[#7f9488] mb-6">
              {search ? "Try a different search term." : "Onboard your first physician to get started."}
            </p>
            {!search && (
              <Button
                onClick={() => setShowInviteModal(true)}
                className="rounded-full h-12 px-6 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black uppercase text-xs tracking-widest"
              >
                <Plus className="h-4 w-4 mr-2" /> Invite Doctor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc, idx) => (
            <motion.div
              key={`${doc.source}-${doc.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="group border-none bg-[#0c120f] hover:bg-[#1a2620]/50 transition-all rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl shadow-black/20">
                <CardContent className="p-0">
                  <div className="p-8 flex items-start gap-6">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 flex items-center justify-center text-2xl font-black text-[#22c55e] border border-[#22c55e]/10 group-hover:scale-105 transition-transform">
                        {doc.avatar}
                      </div>
                      {doc.status === 'active' && (
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#22c55e] border-4 border-[#0c120f] flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-xl font-black italic uppercase tracking-tight text-[#e2e8f0] group-hover:text-[#22c55e] transition-colors truncate">{doc.name}</h3>
                          <p className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.2em] mt-1">{doc.specialty || "—"}</p>
                          <p className="text-[10px] text-[#4f6458] mt-1 truncate">{doc.email}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black uppercase tracking-widest border-none px-3 py-1 rounded-full shrink-0",
                          doc.status === 'active' ? "bg-[#22c55e]/10 text-[#22c55e]" :
                          doc.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                          "bg-red-500/10 text-red-500"
                        )}>
                          {doc.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                          <p className="text-[9px] font-black text-[#4f6458] uppercase tracking-widest mb-0.5">NPI Number</p>
                          <p className="text-xs font-bold text-[#7f9488] font-mono">{doc.npi || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-[#4f6458] uppercase tracking-widest mb-0.5">Patients</p>
                          <p className="text-xs font-bold text-[#e2e8f0]">{doc.patients} Total</p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[#4f6458]">
                           <Globe className="h-3.5 w-3.5" />
                           <span className="text-[10px] font-black uppercase tracking-tight">{doc.licensed_states || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-[#22c55e]/10 text-[#7f9488] hover:text-[#22c55e]">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handleRevoke(doc)}
                            className="h-9 w-9 p-0 rounded-xl hover:bg-red-500/10 text-[#7f9488] hover:text-red-500"
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-white/10 text-[#7f9488]">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Staff Invitation Modal - IMAGE REFERENCE DESIGN */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white text-slate-900 rounded-[3rem] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-10 pb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-serif text-[#0a2e1f]">Staff Invitation</h2>
                  <p className="text-sm text-slate-500 mt-2">Onboard a new medical professional to your clinical network.</p>
                </div>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Form Content */}
              <div className="p-10 pt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      value={invFullName}
                      onChange={e => setInvFullName(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      value={invEmail}
                      onChange={e => setInvEmail(e.target.value)}
                      placeholder="jane.smith@telehealth.os"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>

                  {/* Profile Photo */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Photo</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="photo-upload"
                        onChange={e => setInvPhotoName(e.target.files?.[0]?.name || "")}
                      />
                      <label htmlFor="photo-upload" className="flex items-center gap-3 w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium cursor-pointer hover:bg-slate-50 transition-all">
                        <span className="bg-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Choose File</span>
                        <span className={cn("truncate", invPhotoName ? "text-slate-700" : "text-slate-400")}>
                          {invPhotoName || "No file chosen"}
                        </span>
                      </label>
                    </div>
                  </div>
                  {/* Calendly */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calendly (Optional)</label>
                    <input
                      type="text"
                      value={invCalendly}
                      onChange={e => setInvCalendly(e.target.value)}
                      placeholder="https://calendly.com/dr-smith"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>

                  {/* NPI Number */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NPI Number</label>
                    <input
                      type="text"
                      value={invNpi}
                      onChange={e => setInvNpi(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder="10-digit ID"
                      inputMode="numeric"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>
                  {/* Specialty */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Specialty</label>
                    <div className="relative">
                      <select
                        value={invSpecialty}
                        onChange={e => setInvSpecialty(e.target.value)}
                        className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 appearance-none transition-all"
                      >
                        <option value="">Select Specialty...</option>
                        {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Credentials */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medical Credentials</label>
                    <input
                      type="text"
                      value={invCredentials}
                      onChange={e => setInvCredentials(e.target.value)}
                      placeholder="MD, FAAFP"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>
                  {/* Licensed States */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Licensed States</label>
                    <input
                      type="text"
                      value={invStates}
                      onChange={e => setInvStates(e.target.value.toUpperCase())}
                      placeholder="NY, CA, TX"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                  <ShieldCheck className="h-5 w-5 text-[#0a2e1f] shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                    By inviting this professional, you confirm they are authorized to issue prescriptions under your clinical governance. Credentials will be verified against state records.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-10 pt-6">
                   <button
                    onClick={() => { resetInviteForm(); setShowInviteModal(false); }}
                    disabled={submitting}
                    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                   >
                     Cancel
                   </button>
                   <Button
                     onClick={handleSendInvitation}
                     disabled={submitting}
                     className="rounded-full h-16 px-16 bg-[#0a2e1f] hover:bg-[#061c13] text-white font-bold text-base shadow-2xl shadow-[#0a2e1f]/20 disabled:opacity-60"
                   >
                     {submitting ? (
                       <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Sending...</>
                     ) : "Send Invitation"}
                   </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
