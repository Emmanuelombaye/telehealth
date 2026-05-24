import { useState, useEffect } from "react";
import { Users, Plus, Shield, Edit2, Trash2, Heart, Loader2, X, CheckCircle2, Save } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const RELATIONS = ["Spouse", "Child", "Parent", "Guardian", "Other"] as const;
const ACCESS_LEVELS = ["View Only", "Full Access", "Emergency"] as const;

type FamilyMember = {
  id: string;
  user_id: string;
  full_name: string;
  relation: string;
  age: number | null;
  access_level: string;
  avatar: string | null;
  created_at: string;
};

type FormState = {
  full_name: string;
  relation: string;
  age: string;
  access_level: string;
};

const emptyForm = (): FormState => ({
  full_name: "",
  relation: "Spouse",
  age: "",
  access_level: "View Only",
});

export function FamilyAccessPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Edit state — keyed by member id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMembers();
  }, [user]);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error("Fetch members error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAddMember = async () => {
    if (!user || !addForm.full_name.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("family_members")
        .insert([{
          user_id: user.id,
          full_name: addForm.full_name.trim(),
          relation: addForm.relation,
          age: addForm.age ? parseInt(addForm.age) : null,
          access_level: addForm.access_level,
        }])
        .select()
        .single();
      if (error) throw error;
      setMembers((prev) => [...prev, data]);
      setIsAdding(false);
      setAddForm(emptyForm());
      toast.success(`${data.full_name} added to family access`);
    } catch (err: any) {
      toast.error(err.message || "Could not add member");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const startEdit = (m: FamilyMember) => {
    setEditingId(m.id);
    setEditForm({
      full_name: m.full_name,
      relation: m.relation,
      age: m.age != null ? String(m.age) : "",
      access_level: m.access_level,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm());
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.full_name.trim()) return;
    setEditSaving(true);
    try {
      const { data, error } = await supabase
        .from("family_members")
        .update({
          full_name: editForm.full_name.trim(),
          relation: editForm.relation,
          age: editForm.age ? parseInt(editForm.age) : null,
          access_level: editForm.access_level,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setMembers((prev) => prev.map((m) => (m.id === id ? data : m)));
      setEditingId(null);
      toast.success("Member updated");
    } catch (err: any) {
      toast.error(err.message || "Could not update member");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteMember = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from("family_members").delete().eq("id", id);
      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success(`${name} removed`);
    } catch (err: any) {
      toast.error(err.message || "Could not remove member");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A2E1F]" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Family Ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0A2E1F] tracking-tighter uppercase italic leading-none">
            Family <span className="text-emerald-600 font-serif italic font-normal">Access</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">
            Manage clinical record permissions
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            className="h-10 rounded-xl bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[10px] tracking-widest gap-2 px-6 shadow-xl shadow-emerald-900/10 transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add Member
          </Button>
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
        <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[11px] font-medium text-emerald-900/60 leading-relaxed italic">
          Authorized family members can only access what you explicitly allow. All clinical access is logged for HIPAA compliance and security monitoring.
        </p>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <MemberForm
              title="New Authorization Profile"
              form={addForm}
              onChange={setAddForm}
              onSubmit={handleAddMember}
              onCancel={() => { setIsAdding(false); setAddForm(emptyForm()); }}
              saving={saving}
              submitLabel="Authorize Member"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members list */}
      <div className="space-y-4">
        {members.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-100 bg-slate-50/30 rounded-[3rem] p-24 text-center">
            <Users className="h-12 w-12 mx-auto mb-6 text-slate-200" />
            <h3 className="text-lg font-black text-[#0A2E1F] uppercase italic tracking-tight">No family members added</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Grant access to trusted family members</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {members.map((m) => (
              <div key={m.id}>
                <AnimatePresence mode="wait">
                  {editingId === m.id ? (
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <MemberForm
                        title={`Editing — ${m.full_name}`}
                        form={editForm}
                        onChange={setEditForm}
                        onSubmit={() => handleSaveEdit(m.id)}
                        onCancel={cancelEdit}
                        saving={editSaving}
                        submitLabel="Save Changes"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white group overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[#0A2E1F] text-xl shrink-0 transition-transform group-hover:scale-105">
                              {m.avatar || m.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-[#0A2E1F] uppercase tracking-tight text-lg italic leading-tight">{m.full_name}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {m.relation}{m.age != null ? ` · Age ${m.age}` : ""}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[8px] font-black uppercase tracking-widest border-none px-2.5 py-0.5",
                                    m.access_level === "Full Access" || m.access_level === "Full"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : m.access_level === "Emergency"
                                        ? "bg-red-50 text-red-500"
                                        : "bg-slate-50 text-slate-400",
                                  )}
                                >
                                  {m.access_level}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(m)}
                                className="h-10 w-10 p-0 rounded-xl hover:bg-slate-50 text-slate-300 hover:text-[#0A2E1F]"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMember(m.id, m.full_name)}
                                className="h-10 w-10 p-0 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500"
                                title="Remove"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-6 pt-10 opacity-30">
        <Shield size={20} className="text-[#0A2E1F]" />
        <CheckCircle2 size={20} className="text-[#0A2E1F]" />
        <Heart size={20} className="text-[#0A2E1F]" />
      </div>
    </div>
  );
}

// ── Shared add/edit form ──────────────────────────────────────────────────────
function MemberForm({
  title,
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
}: {
  title: string;
  form: FormState;
  onChange: (f: FormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  return (
    <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-slate-50/50">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-widest">{title}</p>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0 rounded-lg hover:bg-white">
            <X size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name *</label>
            <input
              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="Jane Doe"
              value={form.full_name}
              onChange={(e) => onChange({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relation</label>
            <select
              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all appearance-none"
              value={form.relation}
              onChange={(e) => onChange({ ...form, relation: e.target.value })}
            >
              {RELATIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Age</label>
            <input
              type="number"
              min={0}
              max={120}
              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all"
              placeholder="30"
              value={form.age}
              onChange={(e) => onChange({ ...form, age: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Level</label>
            <select
              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all appearance-none"
              value={form.access_level}
              onChange={(e) => onChange({ ...form, access_level: e.target.value })}
            >
              {ACCESS_LEVELS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            onClick={onSubmit}
            disabled={saving || !form.full_name.trim()}
            className="flex-1 h-14 bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-emerald-900/10 gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
