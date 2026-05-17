import { useState, useEffect } from "react";
import { 
  Settings, Shield, Globe, Bell, CreditCard, Mail, 
  Lock, ToggleLeft, ToggleRight, Save, Plus, Trash2, 
  RefreshCw, CheckCircle, AlertCircle, Zap, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Badge } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { cn } from "../../../components/ui/utils";
import { toast } from "sonner";

interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  general: Settings,
  security: Shield,
  notifications: Bell,
  integrations: Globe,
  billing: CreditCard
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: "", value: "", category: "general", description: "" });

  // Figma-style Destructive Confirmation state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<PlatformSetting | null>(null);
  const [typedConfirmName, setTypedConfirmName] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to sync settings matrix", {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateValue = (id: string, value: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s));
  };

  const handleToggle = (id: string) => {
    setSettings(prev => prev.map(s => {
      if (s.id === id) {
        const newValue = s.value === 'true' ? 'false' : 'true';
        return { ...s, value: newValue };
      }
      return s;
    }));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('platform_settings')
        .upsert(settings.map(s => ({
          id: s.id,
          key: s.key,
          value: s.value,
          category: s.category,
          description: s.description
        })));

      if (error) throw error;
      toast.success("Matrix Synchronized", {
        description: "All platform variables have been committed to the global ledger."
      });
    } catch (err: any) {
      toast.error("Synchronization Failed", {
        description: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('platform_settings').delete().eq('id', id);
      if (error) throw error;
      setSettings(prev => prev.filter(s => s.id !== id));
      toast.info("Record Expunged", {
         description: "Setting removed from the system matrix."
      });
    } catch (err: any) {
      toast.error("Deletion Failed", { description: err.message });
    }
  };

  const handleAdd = async () => {
    if (!newSetting.key) return;
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .insert([newSetting])
        .select();

      if (error) throw error;
      setSettings(prev => [...prev, data[0]]);
      setIsAddModalOpen(false);
      setNewSetting({ key: "", value: "", category: "general", description: "" });
      toast.success("Variable Injected", {
         description: `${newSetting.key} added to platform state.`
      });
    } catch (err: any) {
      toast.error("Injection Failed", { description: err.message });
    }
  };

  const groupedSettings = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, PlatformSetting[]>);

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700 font-sans">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-6">
           <div className="h-20 w-20 rounded-[2rem] bg-emerald-50 flex items-center justify-center border border-emerald-100/50 shadow-sm">
              <Settings size={34} className="text-emerald-600" />
           </div>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <Badge className="bg-emerald-100 text-emerald-800 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">System Matrix</Badge>
                 <span className="h-1 w-1 rounded-full bg-slate-300" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{settings.length} ACTIVE VARIABLES</span>
              </div>
              <h1 className="text-5xl font-black italic uppercase tracking-tighter text-[#0A2E1F] leading-none">Global Ledger</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.35em] mt-2 opacity-80">
                 Environment variables · feature toggles · platform configuration
              </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <Button 
            variant="ghost" 
            className="h-14 w-14 rounded-2xl border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
            onClick={fetchSettings}
           >
             <RefreshCw className={cn("h-6 w-6", loading && "animate-spin")} />
           </Button>
           <Button 
            className="rounded-2xl bg-[#0A2E1F] hover:bg-emerald-950 gap-3 h-14 px-8 text-[10px] font-black uppercase italic tracking-widest shadow-2xl shadow-emerald-900/10 text-white transition-all hover:-translate-y-0.5"
            onClick={() => setIsAddModalOpen(true)}
           >
             <Plus className="h-5 w-5" /> Inject Variable
           </Button>
           <Button 
            className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 gap-3 h-14 px-8 text-[10px] font-black uppercase italic tracking-widest shadow-2xl shadow-emerald-500/20 text-white transition-all hover:-translate-y-0.5"
            onClick={handleSaveAll}
            disabled={saving}
           >
             {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
             Commit Matrix
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center space-y-4">
           <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing state ledger...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10">
           {Object.entries(groupedSettings).map(([category, items], idx) => {
             const Icon = CATEGORY_ICONS[category] || Settings;
             return (
               <motion.div 
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
               >
                 <div className="flex items-center gap-4 mb-6 px-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-lg shadow-slate-900/10">
                       <Icon size={20} />
                    </div>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#0A2E1F]">{category} configuration</h2>
                    <div className="h-[1px] flex-1 bg-slate-100" />
                 </div>

                 <Card className="border-none shadow-3xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
                    <div className="divide-y divide-slate-50/60">
                       {items.map((item) => (
                         <div key={item.id} className="p-8 flex items-center justify-between gap-10 hover:bg-slate-50/30 transition-all group">
                            <div className="flex-1 space-y-1.5">
                               <div className="flex items-center gap-3">
                                  <h3 className="font-black text-base italic uppercase tracking-tight text-slate-900">{item.key.replace(/_/g, ' ')}</h3>
                                  <Badge className="bg-slate-50 text-slate-400 border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">{item.key}</Badge>
                               </div>
                               <p className="text-xs text-slate-400 font-bold tracking-tight opacity-70">{item.description || 'Global platform configuration variable'}</p>
                            </div>

                            <div className="flex items-center gap-6">
                               {item.value === 'true' || item.value === 'false' ? (
                                 <button 
                                  onClick={() => handleToggle(item.id)}
                                  className="h-10 w-20 bg-slate-100 rounded-full p-1.5 relative transition-all"
                                 >
                                    <div className={cn(
                                      "h-7 w-7 rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
                                      item.value === 'true' ? "translate-x-10 bg-emerald-500 text-white" : "translate-x-0 bg-white text-slate-300"
                                    )}>
                                       {item.value === 'true' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    </div>
                                 </button>
                               ) : (
                                 <input 
                                   className="bg-slate-50 border border-slate-100 rounded-xl px-6 py-3 text-sm font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all min-w-[300px]"
                                   value={item.value}
                                   onChange={(e) => handleUpdateValue(item.id, e.target.value)}
                                 />
                               )}

                               <button 
                                onClick={() => {
                                  setDeleteConfirmTarget(item);
                                  setTypedConfirmName("");
                                }}
                                className="h-12 w-12 rounded-xl bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center"
                               >
                                  <Trash2 size={18} />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </Card>
               </motion.div>
             );
           })}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A2E1F]/80 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white border border-slate-100 rounded-[3.5rem] w-full max-w-xl p-12 shadow-3xl text-left"
            >
              <div className="flex items-center gap-6 mb-12">
                <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                  <Plus className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#0A2E1F]">Inject Variable</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 opacity-70">Add new global configuration node</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Key (Internal identifier)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200"
                    placeholder="e.g. platform_fee"
                    value={newSetting.key}
                    onChange={e => setNewSetting({...newSetting, key: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Initial Value</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200"
                    placeholder="Value (or 'true'/'false' for toggles)"
                    value={newSetting.value}
                    onChange={e => setNewSetting({...newSetting, value: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Matrix Category</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
                    value={newSetting.category}
                    onChange={e => setNewSetting({...newSetting, category: e.target.value})}
                  >
                    <option value="general">General</option>
                    <option value="security">Security</option>
                    <option value="notifications">Notifications</option>
                    <option value="integrations">Integrations</option>
                    <option value="billing">Billing</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Description (Optional)</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-[#0A2E1F] outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all placeholder:text-slate-200 h-24 resize-none"
                    placeholder="What does this variable control?"
                    value={newSetting.description}
                    onChange={e => setNewSetting({...newSetting, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                 <Button 
                  variant="ghost" 
                  className="flex-1 rounded-2xl h-16 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Abort
                </Button>
                <Button 
                  className="flex-[2] rounded-2xl h-16 bg-[#0A2E1F] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-emerald-900/20 hover:bg-emerald-950"
                  onClick={handleAdd}
                >
                  Sync to Ledger
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Network Stats - Advanced Global Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
         {[
           { label: "Matrix State", value: "Synchronized", color: "text-emerald-500", icon: Activity, bg: "bg-emerald-50" },
           { label: "Injection Delay", value: "4ms", color: "text-emerald-500", icon: Zap, bg: "bg-emerald-50" },
           { label: "Ledger Security", value: "RLS Active", color: "text-blue-500", icon: ShieldCheck, bg: "bg-blue-50" },
           { label: "System Uptime", value: "99.99%", color: "text-indigo-500", icon: RefreshCw, bg: "bg-indigo-50" },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-7 group transition-all hover:shadow-md">
              <div className="flex items-center gap-5">
                <div className={cn("h-14 w-14 rounded-[1.25rem] flex items-center justify-center transition-all group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className={cn("text-base font-black italic uppercase leading-none", stat.color)}>{stat.value}</p>
                </div>
              </div>
           </Card>
         ))}
      </div>

      {/* Destructive Action Modal (Figma/GitHub Style) */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmTarget(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative z-[111] w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-10 border border-slate-100"
            >
              {/* Alert Header */}
              <div className="flex items-start gap-5">
                <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100/50">
                  <AlertCircle className="h-7 w-7 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#0A2E1F]">Destructive Action</h3>
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-1">Resource Expungement Authorization</p>
                </div>
              </div>

              {/* Warning Text */}
              <div className="mt-8 p-5 bg-rose-50/50 rounded-2xl border border-rose-100/40 text-left">
                <p className="text-xs font-semibold leading-relaxed text-rose-900">
                  Warning: You are about to permanently delete the configuration variable <strong className="font-black text-rose-950">"{deleteConfirmTarget.key}"</strong>. This will instantly expunge the variable from the global system matrix and might cause downstream pipeline interruptions.
                </p>
              </div>

              {/* Confirmation Input */}
              <div className="mt-6 space-y-2.5 text-left">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Type <span className="font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{deleteConfirmTarget.key}</span> to authorize deletion:
                </label>
                <input
                  type="text"
                  value={typedConfirmName}
                  onChange={(e) => setTypedConfirmName(e.target.value)}
                  placeholder={deleteConfirmTarget.key}
                  className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono font-bold text-rose-950 focus:outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => {
                    setDeleteConfirmTarget(null);
                    setTypedConfirmName("");
                  }}
                  className="flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={async () => {
                    if (typedConfirmName === deleteConfirmTarget.key) {
                      await handleDelete(deleteConfirmTarget.id);
                      setDeleteConfirmTarget(null);
                      setTypedConfirmName("");
                    }
                  }}
                  disabled={typedConfirmName !== deleteConfirmTarget.key}
                  className="flex-[2] h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-wider text-xs shadow-xl shadow-rose-500/10 disabled:opacity-30 transition-all active:scale-[0.98]"
                >
                  Expunge Variable
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
