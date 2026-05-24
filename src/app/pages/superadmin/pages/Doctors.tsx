import { useState, useEffect, useMemo } from "react";
import {
  Search, Filter, Edit2, ShieldOff, ShieldCheck,
  ChevronDown, Stethoscope, Plus, X, CheckCircle2, MoreHorizontal,
  Globe, Award, Clipboard, Activity, Loader2, Link2
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import * as FramerMotion from "framer-motion";
const { motion, AnimatePresence } = FramerMotion;
import { supabase } from "../../../../lib/supabaseClient";
import { inviteDoctor, updateDoctorProfile, normalizeLicensedStates } from "../../../../lib/doctorInvite";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";
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
  calendly_url?: string | null;
};

const SPECIALTIES = [
  "General Practice", "Dermatology", "Weight Loss", "Men's Health",
  "Women's Health", "Mental Health", "Endocrinology", "Sleep Medicine",
];

function initials(name: string) {
  if (!name) return "DR";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join("").toUpperCase() || "DR";
}

export function SuperAdminDoctorsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editDoc, setEditDoc] = useState<DoctorRow | null>(null);
  const [editCalUrl, setEditCalUrl] = useState("");
  const [editStates, setEditStates] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editNpi, setEditNpi] = useState("");
  const [editCredentials, setEditCredentials] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [provisionCredentials, setProvisionCredentials] = useState<{ email: string; temp_password?: string } | null>(null);
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
        .select('id, email, full_name, first_name, last_name, specialty, npi_number, credentials, licensed_states, status, patients_count, role, calendly_url')
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
          calendly_url: p.calendly_url ?? null,
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
      toast.error("Could not load clinical network. Check your database schema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(d =>
      (d.name || "").toLowerCase().includes(q) ||
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
    if (!invStates.trim()) {
      toast.error("Licensed states are required (e.g. TX, CA, NY).");
      return;
    }
    setSubmitting(true);
    try {
      const result = await inviteDoctor({
        email: invEmail,
        full_name: invFullName,
        specialty: invSpecialty || null,
        npi_number: invNpi || null,
        credentials: invCredentials || null,
        licensed_states: invStates,
        calendly_url: invCalendly || null,
      });

      if (result.temp_password) {
        setProvisionCredentials({ email: result.email, temp_password: result.temp_password });
        toast.success(`Doctor account created for ${result.email}`);
      } else if (result.already_existed) {
        toast.success(`Updated existing doctor profile for ${result.email}`);
      } else {
        toast.success(`Doctor provisioned: ${result.email}`);
      }

      resetInviteForm();
      setShowInviteModal(false);
      fetchDoctors();
    } catch (err: any) {
      console.error('[Doctors] invite failed:', err);
      toast.error(err.message || "Failed to provision doctor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProvisionPending = async (doc: DoctorRow) => {
    if (submitting || doc.source !== "invitation") return;
    if (!doc.licensed_states?.trim()) {
      toast.error("Add licensed states on the invitation row before provisioning.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await inviteDoctor({
        email: doc.email,
        full_name: doc.name,
        specialty: doc.specialty,
        npi_number: doc.npi,
        credentials: doc.credentials,
        licensed_states: doc.licensed_states,
        calendly_url: doc.calendly_url ?? null,
      });
      if (result.temp_password) {
        setProvisionCredentials({ email: result.email, temp_password: result.temp_password });
      }
      toast.success(`Account ready for ${doc.email}`);
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.message || "Could not provision account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDoctorProfile = async () => {
    if (!editDoc || editSaving || editDoc.source !== "profile") return;
    setEditSaving(true);
    try {
      await updateDoctorProfile(editDoc.id, {
        licensed_states: editStates,
        specialty: editSpecialty || null,
        npi_number: editNpi || null,
        credentials: editCredentials || null,
        calendly_url: editCalUrl.trim() || null,
      });
      toast.success("Doctor profile updated.");
      setEditDoc(null);
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.message || "Could not save profile.");
    } finally {
      setEditSaving(false);
    }
  };

  const openDoctorEditor = (doc: DoctorRow) => {
    if (doc.source !== "profile") {
      toast.message("Use “Create account” on pending invitations, or invite again with licensed states.");
      return;
    }
    setEditCalUrl(doc.calendly_url?.trim() || "");
    setEditStates(doc.licensed_states?.trim() || "");
    setEditSpecialty(doc.specialty || "");
    setEditNpi(doc.npi || "");
    setEditCredentials(doc.credentials || "");
    setEditDoc(doc);
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
    <>
      <SuperAdminShell
        eyebrow="Clinical network"
        title="Doctors & invitations"
        description="Invite creates a live auth account plus doctor profile (not just an invitation row). Edit licensed states and Calendly after onboarding."
        actions={
          <Button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="h-9 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Invite doctor
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Active", value: stats.active.toString(), icon: Stethoscope, ring: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Pending", value: stats.pending.toString(), icon: Clipboard, ring: "text-amber-700", bg: "bg-amber-50" },
            { label: "Patients (sum)", value: stats.totalPatients.toString(), icon: Activity, ring: "text-blue-700", bg: "bg-blue-50" },
            { label: "Rows", value: doctors.length.toString(), icon: Award, ring: "text-slate-700", bg: "bg-slate-100" },
          ].map((s, i) => (
            <Card key={i} className={saPanel}>
              <CardContent className="space-y-2 p-4">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", s.bg, s.ring)}>
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{s.value}</p>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, NPI, or specialty…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none ring-emerald-500/20 focus:ring-2 placeholder:text-slate-400"
            />
          </div>
          <Button variant="outline" size="sm" className="h-10 w-10 shrink-0 rounded-lg border-slate-200 p-0" type="button" aria-label="Filters">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <Card className={saPanel}>
            <CardContent className="space-y-4 p-8 text-center">
              <Stethoscope className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-900">{search ? "No matches" : "No providers yet"}</h3>
              <p className="text-sm text-slate-600">
                {search ? "Try another search." : "Invite a clinician to seed the network."}
              </p>
              {!search && (
                <Button onClick={() => setShowInviteModal(true)} className="h-9 rounded-lg bg-slate-900 px-4 text-sm text-white">
                  <Plus className="mr-2 h-4 w-4" /> Invite doctor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((doc, idx) => (
              <motion.div
                key={`${doc.source}-${doc.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.2) }}
              >
                <Card className={cn(saPanel, "overflow-hidden transition-shadow hover:shadow-md")}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
                          {doc.avatar}
                        </div>
                        {doc.status === "active" && (
                          <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900">{doc.name}</h3>
                            <p className="text-xs font-medium text-emerald-800">{doc.specialty || "—"}</p>
                            <p className="truncate text-xs text-slate-500">{doc.email}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-[10px] font-medium capitalize",
                              doc.status === "active"
                                ? "border-emerald-200 text-emerald-800"
                                : doc.status === "pending"
                                  ? "border-amber-200 text-amber-800"
                                  : "border-red-200 text-red-700",
                            )}
                          >
                            {doc.status}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">NPI</p>
                            <p className="font-mono text-slate-800">{doc.npi || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Patients</p>
                            <p className="font-medium text-slate-900">{doc.patients}</p>
                          </div>
                        </div>
                        {doc.calendly_url ? (
                          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-blue-50/80 px-2 py-1.5 text-[10px] text-blue-900 ring-1 ring-blue-100">
                            <Link2 className="h-3 w-3 shrink-0 mt-0.5" />
                            <span className="min-w-0 break-all leading-snug">{doc.calendly_url}</span>
                          </div>
                        ) : doc.source === "profile" ? (
                          <p className="mt-2 text-[10px] text-amber-700">No Cal/Calendly link — add one so patients can book video visits.</p>
                        ) : null}
                        {doc.source === "invitation" && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={submitting}
                            onClick={() => void handleProvisionPending(doc)}
                            className="mt-2 h-8 rounded-lg bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
                          >
                            Create account
                          </Button>
                        )}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="flex max-w-[55%] items-center gap-1 text-[11px] text-slate-500">
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{doc.licensed_states ? normalizeLicensedStates(doc.licensed_states) : "—"}</span>
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              type="button"
                              onClick={() => openDoctorEditor(doc)}
                              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:text-slate-900"
                              aria-label="Edit doctor profile"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevoke(doc)}
                              className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:text-red-600"
                            >
                              <ShieldOff className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0 text-slate-400">
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
      </SuperAdminShell>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cal / Calendly booking URL (optional)</label>
                    <input
                      type="url"
                      value={invCalendly}
                      onChange={e => setInvCalendly(e.target.value)}
                      placeholder="https://cal.com/org/visit or https://calendly.com/dr-smith"
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
                    This creates a Supabase auth user and doctor profile immediately. Share the one-time password with the clinician so they can sign in and change it. Licensed states are required for patient assignment.
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
                     ) : "Create doctor account"}
                   </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !editSaving && setEditDoc(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative z-[101] w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Edit doctor</h3>
                  <p className="mt-1 text-sm text-slate-500">{editDoc.name}</p>
                </div>
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={() => setEditDoc(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Licensed states</label>
                  <input
                    value={editStates}
                    onChange={(e) => setEditStates(e.target.value.toUpperCase())}
                    placeholder="TX, CA, NY"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Specialty</label>
                  <select
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  >
                    <option value="">—</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">NPI</label>
                  <input
                    value={editNpi}
                    onChange={(e) => setEditNpi(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Credentials</label>
                  <input
                    value={editCredentials}
                    onChange={(e) => setEditCredentials(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
              </div>
              <label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Cal.com or Calendly URL
              </label>
              <textarea
                value={editCalUrl}
                onChange={(e) => setEditCalUrl(e.target.value)}
                rows={2}
                placeholder="https://cal.com/your-org/video-intake"
                className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#0a2e1f] focus:outline-none focus:ring-2 focus:ring-[#0a2e1f]/15"
              />
              <p className="mt-2 text-xs text-slate-500">
                Licensed states drive checkout doctor matching. Calendar URL is used for video enrollment.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={editSaving}
                  onClick={() => setEditDoc(null)}
                  className="rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={editSaving}
                  onClick={() => void handleSaveDoctorProfile()}
                  className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {provisionCredentials && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setProvisionCredentials(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative z-[111] w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-slate-900">Sign-in credentials</h3>
              <p className="mt-2 text-sm text-slate-600">
                Share this once with <span className="font-medium">{provisionCredentials.email}</span>. They should change the password after first login.
              </p>
              {provisionCredentials.temp_password ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 font-mono text-sm text-slate-900 ring-1 ring-slate-200">
                  {provisionCredentials.temp_password}
                </div>
              ) : (
                <p className="mt-4 text-sm text-amber-800">Account already existed — no new password was generated.</p>
              )}
              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setProvisionCredentials(null)}
                  className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
