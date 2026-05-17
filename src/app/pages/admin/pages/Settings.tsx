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

const CATEGORY_GRADIENTS: Record<string, string> = {
  general: "from-blue-500 to-cyan-500",
  security: "from-emerald-500 to-teal-500",
  notifications: "from-amber-400 to-orange-500",
  integrations: "from-purple-500 to-indigo-500",
  billing: "from-rose-400 to-red-500"
};

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: "", value: "", category: "general", description: "" });

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
    <div className="relative min-h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Immersive Blended Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-300/30 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      <div className="absolute bottom-[20%] left-[20%] w-[45%] h-[45%] bg-amber-200/20 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '9s', animationDelay: '3s' }} />

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-12 p-8 pb-24 animate-in fade-in duration-1000">
        
        {/* Header Area */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white/40 backdrop-blur-3xl border border-white/60 p-8 rounded-[3rem] shadow-2xl shadow-indigo-900/5"
        >
          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-indigo-500 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
              <div className="relative h-24 w-24 rounded-[2.5rem] bg-gradient-to-br from-white to-slate-50 flex items-center justify-center border border-white shadow-xl">
                <Settings size={40} className="text-emerald-600 drop-shadow-sm" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-emerald-500/30">System Matrix</Badge>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-300/50" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">{settings.length} Active Variables</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-[#0A2E1F] to-indigo-900 leading-tight">
                Global Ledger
              </h1>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 opacity-80">
                Environment Variables · Feature Toggles · Orchestration
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              variant="ghost" 
              className="h-16 w-16 rounded-[2rem] bg-white/50 border border-white/60 text-slate-500 hover:bg-white hover:text-indigo-600 hover:scale-105 hover:rotate-180 transition-all duration-500 shadow-sm"
              onClick={fetchSettings}
            >
              <RefreshCw className={cn("h-6 w-6", loading && "animate-spin")} />
            </Button>
            <Button 
              className="rounded-[2rem] bg-white hover:bg-slate-50 border border-slate-100 text-[#0A2E1F] gap-3 h-16 px-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1"
              onClick={() => setIsAddModalOpen(true)}
            >
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Plus className="h-4 w-4" />
              </div>
              Inject Variable
            </Button>
            <Button 
              className="rounded-[2rem] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 gap-3 h-16 px-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/30 text-white transition-all hover:-translate-y-1"
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Commit Matrix
            </Button>
          </div>
        </motion.div>

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Matrix State", value: "Synchronized", gradient: "from-emerald-400 to-teal-500", icon: Activity },
            { label: "Injection Delay", value: "4ms", gradient: "from-fuchsia-400 to-pink-500", icon: Zap },
            { label: "Ledger Security", value: "RLS Active", gradient: "from-blue-400 to-indigo-500", icon: ShieldCheck },
            { label: "System Uptime", value: "99.99%", gradient: "from-amber-400 to-orange-500", icon: RefreshCw },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
            >
              <Card className="relative overflow-hidden border border-white/60 shadow-xl shadow-indigo-900/5 rounded-[2.5rem] bg-white/40 backdrop-blur-xl p-8 group hover:-translate-y-1 transition-all duration-300">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                <div className="flex flex-col gap-4 relative z-10">
                  <div className={`h-12 w-12 rounded-[1.25rem] flex items-center justify-center bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <p className={`text-xl font-black italic uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-50 animate-pulse rounded-full" />
              <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin relative z-10" />
            </div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Synchronizing ledger...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {Object.entries(groupedSettings).map(([category, items], idx) => {
              const Icon = CATEGORY_ICONS[category] || Settings;
              const grad = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.general;
              
              return (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1), duration: 0.6 }}
                >
                  <div className="flex items-center gap-6 mb-8 px-2">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${grad} text-white flex items-center justify-center shadow-lg`}>
                      <Icon size={24} />
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">{category} Config</h2>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                  </div>

                  <Card className="border border-white/60 shadow-2xl shadow-indigo-900/5 bg-white/50 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
                    <div className="divide-y divide-slate-100/50">
                      {items.map((item, itemIdx) => (
                        <div key={item.id} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:bg-white/60 transition-all duration-300 group">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-4">
                              <h3 className="font-black text-lg italic uppercase tracking-tight text-slate-900">{item.key.replace(/_/g, ' ')}</h3>
                              <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em]">{item.key}</Badge>
                            </div>
                            <p className="text-sm text-slate-500 font-medium tracking-tight max-w-2xl">{item.description || 'Global platform configuration variable'}</p>
                          </div>

                          <div className="flex items-center gap-6">
                            {item.value === 'true' || item.value === 'false' ? (
                              <button 
                                onClick={() => handleToggle(item.id)}
                                className={cn(
                                  "relative h-12 w-[5.5rem] rounded-[2rem] p-1.5 transition-all duration-500 overflow-hidden shadow-inner",
                                  item.value === 'true' ? `bg-gradient-to-r ${grad}` : "bg-slate-200"
                                )}
                              >
                                <div className={cn(
                                  "h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-500 z-10 relative",
                                  item.value === 'true' ? "translate-x-11" : "translate-x-0"
                                )}>
                                  {item.value === 'true' ? <CheckCircle size={16} className={`text-transparent bg-clip-text bg-gradient-to-r ${grad}`} color="currentColor" style={{ stroke: "url(#emerald-gradient)" }} /> : <AlertCircle size={16} className="text-slate-400" />}
                                  {/* Inline SVG Gradient definition for the checkmark stroke if needed, but Tailwind color usually works. Fallback to inline color */}
                                  {item.value === 'true' && <CheckCircle size={16} className="absolute text-emerald-500" />}
                                </div>
                              </button>
                            ) : (
                              <input 
                                className="bg-white/50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all w-full lg:min-w-[320px] shadow-sm"
                                value={item.value}
                                onChange={(e) => handleUpdateValue(item.id, e.target.value)}
                              />
                            )}

                            <button 
                              onClick={() => {
                                setDeleteConfirmTarget(item);
                                setTypedConfirmName("");
                              }}
                              className="h-14 w-14 rounded-2xl bg-white border border-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:border-rose-500 hover:text-white flex items-center justify-center shadow-sm hover:shadow-rose-500/30 hover:-translate-y-1"
                            >
                              <Trash2 size={20} />
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
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-xl bg-white/80 backdrop-blur-3xl border border-white rounded-[3.5rem] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-6 mb-10">
                  <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                    <Plus className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Inject Variable</h2>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Global configuration node</p>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Key (Internal identifier)</label>
                    <input 
                      className="w-full bg-white/60 border border-white shadow-sm rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                      placeholder="e.g. platform_fee"
                      value={newSetting.key}
                      onChange={e => setNewSetting({...newSetting, key: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Initial Value</label>
                    <input 
                      className="w-full bg-white/60 border border-white shadow-sm rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300"
                      placeholder="Value (or 'true'/'false' for toggles)"
                      value={newSetting.value}
                      onChange={e => setNewSetting({...newSetting, value: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Matrix Category</label>
                    <select 
                      className="w-full bg-white/60 border border-white shadow-sm rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Description (Optional)</label>
                    <textarea 
                      className="w-full bg-white/60 border border-white shadow-sm rounded-[1.5rem] px-6 py-5 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-300 h-28 resize-none"
                      placeholder="What does this variable control?"
                      value={newSetting.description}
                      onChange={e => setNewSetting({...newSetting, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="relative z-10 flex gap-4 mt-10">
                   <Button 
                    variant="ghost" 
                    className="flex-1 rounded-[1.5rem] h-16 text-slate-500 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-slate-100/80 transition-colors"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Abort
                  </Button>
                  <Button 
                    className="flex-[2] rounded-[1.5rem] h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-emerald-500/30 hover:scale-[1.02] transition-all"
                    onClick={handleAdd}
                  >
                    Sync to Ledger
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Destructive Action Modal */}
        <AnimatePresence>
          {deleteConfirmTarget && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmTarget(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative z-[111] w-full max-w-lg bg-white/90 backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl p-10 border border-white/50"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[60px] -mr-32 -mt-32 pointer-events-none" />

                <div className="relative z-10 flex items-start gap-6">
                  <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shrink-0 shadow-xl shadow-rose-500/30">
                    <AlertCircle className="h-10 w-10 text-white" />
                  </div>
                  <div className="pt-2">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Destructive</h3>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-2">Resource Expungement</p>
                  </div>
                </div>

                <div className="relative z-10 mt-10 p-6 bg-white/60 border border-white rounded-[2rem] text-left shadow-sm">
                  <p className="text-sm font-semibold leading-relaxed text-slate-700">
                    Warning: You are about to permanently delete the configuration variable <strong className="font-black text-rose-600">"{deleteConfirmTarget.key}"</strong>. This will instantly expunge the variable from the global system matrix and might cause downstream pipeline interruptions.
                  </p>
                </div>

                <div className="relative z-10 mt-8 space-y-3 text-left">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-2">
                    Type <span className="font-mono font-black text-rose-600">{deleteConfirmTarget.key}</span> to authorize:
                  </label>
                  <input
                    type="text"
                    value={typedConfirmName}
                    onChange={(e) => setTypedConfirmName(e.target.value)}
                    placeholder={deleteConfirmTarget.key}
                    className="w-full h-16 px-6 bg-white/60 border border-white rounded-[1.5rem] text-sm font-mono font-bold text-rose-600 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all shadow-sm"
                  />
                </div>

                <div className="relative z-10 mt-10 flex gap-4">
                  <button
                    onClick={() => {
                      setDeleteConfirmTarget(null);
                      setTypedConfirmName("");
                    }}
                    className="flex-1 h-16 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100/80 transition-colors"
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
                    className="flex-[2] h-16 rounded-[1.5rem] bg-gradient-to-r from-rose-500 to-red-600 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-rose-500/30 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98]"
                  >
                    Expunge Variable
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
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
