import { useState, useEffect } from "react";
import { Users, Plus, Shield, Edit2, Trash2, Heart, Loader2, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { motion, AnimatePresence } from "framer-motion";

export function FamilyAccessPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    full_name: "",
    relation: "Spouse",
    age: "",
    access_level: "View Only"
  });

  useEffect(() => {
    if (!user) return;
    fetchMembers();
  }, [user]);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error("Fetch members error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddMember = async () => {
    if (!user || !form.full_name) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('family_members').insert([{
        user_id: user.id,
        full_name: form.full_name,
        relation: form.relation,
        age: parseInt(form.age) || 0,
        access_level: form.access_level
      }]).select().single();
      
      if (error) throw error;
      setMembers([...members, data]);
      setIsAdding(false);
      setForm({ full_name: "", relation: "Spouse", age: "", access_level: "View Only" });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await supabase.from('family_members').delete().eq('id', id);
      setMembers(members.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#0A2E1F]" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Family Ledger...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0A2E1F] tracking-tighter uppercase italic leading-none">Family <span className="text-emerald-600 font-serif italic font-normal">Access</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Manage clinical record permissions</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="h-10 rounded-xl bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[10px] tracking-widest gap-2 px-6 shadow-xl shadow-emerald-900/10 transition-all">
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

      {/* ── ADD FORM ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[2.5rem] overflow-hidden bg-slate-50/50">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-widest">New Authorization Profile</p>
                   <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-8 w-8 p-0 rounded-lg hover:bg-white"><X size={16} /></Button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                      <input 
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all"
                        placeholder="John Doe"
                        value={form.full_name}
                        onChange={e => setForm({...form, full_name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relation</label>
                      <select 
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all appearance-none"
                        value={form.relation}
                        onChange={e => setForm({...form, relation: e.target.value})}
                      >
                         <option>Spouse</option>
                         <option>Child</option>
                         <option>Parent</option>
                         <option>Guardian</option>
                         <option>Other</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Age</label>
                      <input 
                        type="number"
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all"
                        placeholder="30"
                        value={form.age}
                        onChange={e => setForm({...form, age: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Level</label>
                      <select 
                        className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/30 transition-all appearance-none"
                        value={form.access_level}
                        onChange={e => setForm({...form, access_level: e.target.value})}
                      >
                         <option>View Only</option>
                         <option>Full Access</option>
                         <option>Restricted</option>
                      </select>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={handleAddMember} disabled={saving} className="flex-1 h-14 bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-emerald-900/10">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Member"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MEMBERS LIST ── */}
      <div className="space-y-4">
        {members.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-100 bg-slate-50/30 rounded-[3rem] p-24 text-center">
            <Users className="h-12 w-12 mx-auto mb-6 text-slate-200" />
            <h3 className="text-lg font-black text-[#0A2E1F] uppercase italic tracking-tight">No family members added</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Grant access to trusted family members</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {members.map(m => (
              <Card key={m.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[#0A2E1F] text-xl shrink-0 transition-transform group-hover:scale-105">
                      {m.avatar || m.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#0A2E1F] uppercase tracking-tight text-lg italic leading-tight">{m.full_name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.relation} · Age {m.age}</span>
                         <Badge variant="outline" className={cn(
                           "text-[8px] font-black uppercase tracking-widest border-none px-2.5 py-0.5",
                           m.access_level === "Full Access" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                         )}>
                           {m.access_level}
                         </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-50 text-slate-300 hover:text-[#0A2E1F]"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMember(m.id)} className="h-10 w-10 p-0 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── SECURITY BADGE ── */}
      <div className="flex items-center justify-center gap-6 pt-10 opacity-30">
         <Shield size={20} className="text-[#0A2E1F]" />
         <CheckCircle2 size={20} className="text-[#0A2E1F]" />
         <Heart size={20} className="text-[#0A2E1F]" />
      </div>

    </div>
  );
}
