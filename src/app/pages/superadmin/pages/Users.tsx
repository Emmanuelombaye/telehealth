import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Edit2,
  Shield,
  UserCheck,
  Building2,
  Eye,
  Plus,
  X,
  Loader2,
  Mail,
  Ban,
  ShieldAlert,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { SuperAdminShell, saPanel } from "../../../components/superadmin/SuperAdminShell.tsx";
import { Button, Card, CardContent, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import * as FramerMotion from "framer-motion";
import { toast } from "sonner";

const { motion, AnimatePresence } = FramerMotion;

type ProfileRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  brand_id?: string | null;
  sub_brand?: string | null;
  status?: string | null;
  country?: string | null;
  created_at?: string | null;
};

type UserPanel = { type: "view" | "edit"; user: ProfileRow } | null;

export function SuperAdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [dbUsers, setDbUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [userPanel, setUserPanel] = useState<UserPanel>(null);
  const [editDraft, setEditDraft] = useState({
    full_name: "",
    role: "patient",
    brand_id: "",
    status: "active",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    role: "patient",
    brand: "Peak Health",
  });

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setDbUsers((data as ProfileRow[]) || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setDbUsers([
        {
          id: "1",
          full_name: "Alice Thompson",
          email: "alice@branda.health",
          role: "patient",
          sub_brand: "Peak Health",
          status: "active",
          country: "🇺🇸",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          full_name: "Dr. Sarah Johnson",
          email: "sarah@branda.health",
          role: "doctor",
          sub_brand: "Peak Health",
          status: "active",
          country: "🇺🇸",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel("profiles-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchUsers();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openView = (u: ProfileRow) => setUserPanel({ type: "view", user: u });

  const openEdit = (u: ProfileRow) => {
    setEditDraft({
      full_name: u.full_name || "",
      role: u.role || "patient",
      brand_id: u.brand_id || u.sub_brand || "",
      status: (u.status as string) || "active",
    });
    setUserPanel({ type: "edit", user: u });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { error } = await supabase.from("profiles").insert([
        {
          full_name: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          brand_id: newUser.brand,
          status: "active",
        },
      ]);
      if (error) throw error;
      setShowInviteModal(false);
      setNewUser({ full_name: "", email: "", role: "patient", brand: "Peak Health" });
      toast.success("Profile row created", { description: "Invite still requires Auth signup for a real login." });
      fetchUsers();
    } catch (err) {
      console.error("Invite error:", err);
      toast.error("Could not create profile", {
        description: err instanceof Error ? err.message : "Check RLS and profiles columns.",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleStatusUpdate = async (id: string, currentStatus: string | null | undefined) => {
    const cur = currentStatus || "active";
    const newStatus = cur === "active" ? "suspended" : "active";
    setUpdatingStatusId(id);
    try {
      const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast.success(newStatus === "suspended" ? "User suspended" : "User reactivated");
      fetchUsers();
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Status update failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPanel || userPanel.type !== "edit") return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editDraft.full_name.trim() || null,
          role: editDraft.role,
          brand_id: editDraft.brand_id.trim() || null,
          status: editDraft.status,
        })
        .eq("id", userPanel.user.id);
      if (error) throw error;
      toast.success("Profile updated");
      setUserPanel(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const filtered = dbUsers.filter((u) => {
    const matchSearch =
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchBrand = brandFilter === "all" || (u.brand_id || u.sub_brand) === brandFilter;
    return matchSearch && matchRole && matchBrand;
  });

  const counts = {
    total: dbUsers.length,
    patients: dbUsers.filter((u) => u.role === "patient").length,
    doctors: dbUsers.filter((u) => u.role === "doctor").length,
    admins: dbUsers.filter(
      (u) => u.role === "admin" || u.role === "superadmin" || u.role === "super_admin" || u.role === "brand_admin",
    ).length,
    suspended: dbUsers.filter((u) => u.status === "suspended").length,
  };

  const statusLabel = (s: string | null | undefined) => {
    if (s === "active") return "Active";
    if (s === "suspended") return "Suspended";
    return s ? String(s) : "—";
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
      description="Search and manage profiles. View opens a summary; Edit updates the profile row; the shield toggles active / suspended (requires super_admin RLS)."
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
      <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
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

      <div className={cn(saPanel, "mt-6 flex flex-col gap-3 p-3 md:flex-row md:items-center")}>
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

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
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
                            : u.role === "admin" || u.role === "super_admin" || u.role === "superadmin"
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
                      <span className="font-medium text-slate-800">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">Status</span>
                      <span
                        className={cn(
                          "font-medium",
                          u.status === "active" ? "text-emerald-700" : u.status === "suspended" ? "text-red-600" : "text-slate-600",
                        )}
                      >
                        {statusLabel(u.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 rounded-lg p-0"
                      title="Edit profile"
                      onClick={() => openEdit(u)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleStatusUpdate(u.id, u.status)}
                      variant="outline"
                      size="sm"
                      disabled={updatingStatusId === u.id}
                      title={u.status === "active" ? "Suspend user" : "Reactivate user"}
                      className={cn(
                        "h-9 w-9 rounded-lg p-0",
                        u.status === "active" ? "hover:border-red-200 hover:bg-red-50" : "hover:border-emerald-200 hover:bg-emerald-50",
                      )}
                    >
                      {updatingStatusId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : u.status === "active" ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg px-3 text-xs font-medium"
                      title="View details"
                      onClick={() => openView(u)}
                    >
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

      {/* View / edit user */}
      <AnimatePresence>
        {userPanel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setUserPanel(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {userPanel.type === "view" ? "User details" : "Edit profile"}
                </h2>
                <button
                  type="button"
                  onClick={() => setUserPanel(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {userPanel.type === "view" ? (
                <div className="space-y-4 p-5 text-sm">
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Name</dt>
                      <dd className="mt-0.5 font-medium text-slate-900">{userPanel.user.full_name || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
                      <dd className="mt-0.5 break-all text-slate-800">{userPanel.user.email || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Role</dt>
                      <dd className="mt-0.5 capitalize text-slate-800">{userPanel.user.role || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Brand</dt>
                      <dd className="mt-0.5 text-slate-800">{userPanel.user.brand_id || userPanel.user.sub_brand || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</dt>
                      <dd className="mt-0.5 text-slate-800">{statusLabel(userPanel.user.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">User ID</dt>
                      <dd className="mt-0.5 font-mono text-xs text-slate-600">{userPanel.user.id}</dd>
                    </div>
                  </dl>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setUserPanel(null)}>
                      Close
                    </Button>
                    <Button type="button" className="flex-1 bg-slate-900 text-white hover:bg-slate-800" onClick={() => openEdit(userPanel.user)}>
                      Edit
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4 p-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Full name</label>
                    <Input
                      value={editDraft.full_name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, full_name: e.target.value }))}
                      className="rounded-lg border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Role</label>
                    <select
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      value={editDraft.role}
                      onChange={(e) => setEditDraft((d) => ({ ...d, role: e.target.value }))}
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                      <option value="brand_admin">Brand admin</option>
                      <option value="super_admin">Super admin</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="affiliate">Affiliate</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Brand ID</label>
                    <Input
                      value={editDraft.brand_id}
                      onChange={(e) => setEditDraft((d) => ({ ...d, brand_id: e.target.value }))}
                      placeholder="e.g. Peak Health"
                      className="rounded-lg border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Status</label>
                    <select
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      value={editDraft.status}
                      onChange={(e) => setEditDraft((d) => ({ ...d, status: e.target.value }))}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500">
                    Email and auth identity are not changed here — only the <code className="rounded bg-slate-100 px-1">profiles</code> row.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => openView(userPanel.user)}>
                      Back
                    </Button>
                    <Button type="submit" disabled={savingProfile} className="flex-1 bg-slate-900 text-white hover:bg-slate-800">
                      {savingProfile ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save changes"}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A2E1F]/60 backdrop-blur-md"
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[48px] border border-white/20 bg-white shadow-3xl"
            >
              <div className="flex items-center justify-between border-b border-slate-50 bg-[#0A2E1F] p-10 text-white">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">
                      Identity Provisioning
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">Invite Platform User</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-8 p-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Legal Full Name</label>
                  <Input
                    required
                    placeholder="e.g. Johnathan Doe"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="h-14 rounded-2xl border-slate-200 font-bold focus:ring-emerald-500/10"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Professional Email</label>
                  <Input
                    required
                    type="email"
                    placeholder="e.g. j.doe@peak.health"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="h-14 rounded-2xl border-slate-200 font-bold focus:ring-emerald-500/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Identity Role</label>
                    <select
                      className="flex h-14 w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Clinical Doctor</option>
                      <option value="admin">Brand Admin</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Designated Brand</label>
                    <select
                      className="flex h-14 w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                      value={newUser.brand}
                      onChange={(e) => setNewUser({ ...newUser, brand: e.target.value })}
                    >
                      <option>Peak Health</option>
                      <option>Bio-Optimizers</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                  <div className="flex items-center gap-4">
                    <ShieldAlert className="h-8 w-8 text-emerald-600" />
                    <p className="text-[10px] font-black uppercase leading-relaxed tracking-widest text-emerald-800">
                      The invited user will receive a secure portal activation link within their encrypted mailbox.
                    </p>
                  </div>
                  {inviting && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-2 duration-500">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2 }}
                          className="h-full bg-emerald-600"
                        />
                      </div>
                      <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600">
                        Provisioning Identity Vault...
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  disabled={inviting}
                  className="mt-6 h-16 w-full rounded-[24px] bg-[#0A2E1F] font-black uppercase tracking-[0.3em] text-[11px] text-white shadow-3xl shadow-emerald-900/30 transition-all hover:-translate-y-1 hover:bg-emerald-950 active:translate-y-0"
                >
                  {inviting ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-400" /> : "Authorize & Send Invite"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SuperAdminShell>
  );
}
