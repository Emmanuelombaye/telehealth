import { useState, useEffect } from "react";
import { 
  Settings, Shield, Globe, Bell, CreditCard, Mail, 
  Lock, ToggleLeft, ToggleRight, Save, Plus, Trash2, 
  RefreshCw, AlertCircle, Zap, Activity, Check, Database, X
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

const CATEGORIES = [
  { id: "general", name: "General", icon: Settings, desc: "Global variables & general parameters" },
  { id: "security", name: "Security", icon: Shield, desc: "RLS, auth limits, encryption tokens" },
  { id: "notifications", name: "Notifications", icon: Bell, desc: "Webhook channels & system alerts" },
  { id: "integrations", name: "Integrations", icon: Globe, desc: "Third-party APIs & connections" },
  { id: "billing", name: "Billing", icon: CreditCard, desc: "Transactional rules & pricing matrix" }
];

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [originalSettings, setOriginalSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
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
      setOriginalSettings(JSON.parse(JSON.stringify(data || [])));
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

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

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
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
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
      setOriginalSettings(prev => prev.filter(s => s.id !== id));
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
      setOriginalSettings(prev => [...prev, data[0]]);
      setIsAddModalOpen(false);
      setNewSetting({ key: "", value: "", category: "general", description: "" });
      toast.success("Variable Injected", {
         description: `${newSetting.key} added to platform state.`
      });
    } catch (err: any) {
      toast.error("Injection Failed", { description: err.message });
    }
  };

  const filteredSettings = settings.filter(s => s.category === activeTab);

  return (
    <div className="relative min-h-screen w-full bg-[#f8f9fa] overflow-hidden font-sans pb-32">
      {/* Immersive Blended Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0A2E1F]/5 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#0A2E1F]/10 rounded-full mix-blend-multiply filter blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: '10s', animationDelay: '1s' }} />

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-10 p-6 md:p-8 animate-in fade-in duration-700">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-[#0A2E1F] flex items-center justify-center text-white shadow-lg shadow-emerald-950/20">
              <Settings size={28} className="animate-spin-slow text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-emerald-50 text-emerald-700 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em]">Global Variables</Badge>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{settings.length} active nodes</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A2E1F]">
                System Config
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="ghost" 
              className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer"
              onClick={fetchSettings}
            >
              <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
            </Button>
            <Button 
              className="rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#0A2E1F] gap-2 h-12 px-5 text-[11px] font-black uppercase tracking-widest shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4 text-emerald-600" />
              Add Variable
            </Button>
            <Button 
              className="rounded-xl bg-[#0A2E1F] hover:bg-[#124430] gap-2 h-12 px-6 text-[11px] font-black uppercase tracking-widest text-white shadow-md shadow-emerald-950/20 transition-all hover:-translate-y-0.5 cursor-pointer"
              onClick={handleSaveAll}
              disabled={saving || !hasUnsavedChanges}
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="bg-white rounded-2xl p-2 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-bold text-[13px] tracking-wide relative cursor-pointer",
                    isActive 
                      ? "bg-slate-50 text-[#0A2E1F]" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                  {cat.name}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" 
                    />
                  )}
                  <span className={cn(
                    "ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                    isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                  )}>
                    {settings.filter(s => s.category === cat.id).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Area */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing variable registry...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="px-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {CATEGORIES.find(c => c.id === activeTab)?.name} Configuration
              </h2>
              <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">
                {CATEGORIES.find(c => c.id === activeTab)?.desc}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {filteredSettings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white rounded-[2rem] border border-slate-100 p-16 flex flex-col items-center justify-center text-center shadow-sm"
                >
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                    <Database size={24} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">No variables active</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-1">
                    There are currently no active system parameters mapped to this category.
                  </p>
                  <Button 
                    className="mt-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#0A2E1F] gap-2 h-11 px-4 text-xs font-black uppercase tracking-widest shadow-sm cursor-pointer"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    Inject Variable
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {filteredSettings.map(item => {
                    const isBoolean = item.value === 'true' || item.value === 'false';
                    const isValTrue = item.value === 'true';

                    return (
                      <Card 
                        key={item.id} 
                        className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-slate-200 transition-all duration-300 relative overflow-hidden min-h-[220px]"
                      >
                        <div>
                          {/* Key & Delete */}
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 max-w-[80%]">
                              <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-slate-400">KEY:</span>
                              <Badge className="bg-slate-50 text-slate-700 border border-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider truncate max-w-full">
                                {item.key}
                              </Badge>
                            </div>
                            
                            <button
                              onClick={() => {
                                setDeleteConfirmTarget(item);
                                setTypedConfirmName("");
                              }}
                              className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Variable Label & Description */}
                          <h3 className="text-base font-bold text-slate-800 tracking-tight leading-snug uppercase mb-1">
                            {item.key.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium tracking-tight leading-relaxed max-w-[90%]">
                            {item.description || 'Global configuration parameter for platform orchestration.'}
                          </p>
                        </div>

                        {/* Setting Input / Toggle Control */}
                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Value:</span>
                          
                          {isBoolean ? (
                            <button
                              onClick={() => handleToggle(item.id)}
                              className={cn(
                                "relative h-8 w-16 rounded-full p-1 transition-all duration-500 cursor-pointer shadow-inner",
                                isValTrue ? "bg-emerald-500" : "bg-slate-200"
                              )}
                            >
                              <div className={cn(
                                "h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-500",
                                isValTrue ? "translate-x-8" : "translate-x-0"
                              )}>
                                {isValTrue ? <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                              </div>
                            </button>
                          ) : (
                            <input 
                              className="bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all w-48 md:w-56 shadow-inner"
                              value={item.value}
                              onChange={(e) => handleUpdateValue(item.id, e.target.value)}
                            />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Unsaved Changes Indicator (Fixed Float) */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-8 left-6 right-6 md:left-auto md:right-12 z-50 max-w-md w-full"
            >
              <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Unsaved Changes</h4>
                    <p className="text-[10px] text-slate-400 font-medium">You have pending modifications.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={fetchSettings}
                    className="px-3 py-2 rounded-lg text-xs font-black uppercase text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                  <Button 
                    className="rounded-lg bg-emerald-500 hover:bg-emerald-400 h-9 px-4 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-emerald-500/20 cursor-pointer"
                    onClick={handleSaveAll}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-xl p-4 flex justify-center items-center"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative my-auto w-full max-w-md bg-white border border-slate-100 rounded-[2rem] p-6 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12)] text-left overflow-hidden"
              >
                {/* Close Button 'X' */}
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer z-20"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative z-10 flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-800">Inject Variable</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Add a new global system variable node.</p>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider ml-1">Key (Internal identifier)</label>
                    <input 
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white shadow-sm rounded-xl px-4 py-2.5 text-xs font-bold text-slate-955 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all placeholder:text-slate-400 shadow-inner"
                      placeholder="e.g. PLATFORM_FEE"
                      value={newSetting.key}
                      onChange={e => setNewSetting({...newSetting, key: e.target.value})}
                    />
                  </div>

                  {/* 2-Column Grid for Value & Category to save substantial height */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider ml-1">Initial Value</label>
                      <input 
                        className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white shadow-sm rounded-xl px-4 py-2.5 text-xs font-bold text-slate-955 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all placeholder:text-slate-400 shadow-inner"
                        placeholder="e.g. true"
                        value={newSetting.value}
                        onChange={e => setNewSetting({...newSetting, value: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider ml-1">Category</label>
                      <select 
                        className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white shadow-sm rounded-xl px-4 py-2.5 text-xs font-bold text-slate-955 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all appearance-none cursor-pointer"
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
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider ml-1">Description (Optional)</label>
                    <textarea 
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white shadow-sm rounded-xl px-4 py-2.5 text-xs font-bold text-slate-955 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all placeholder:text-slate-400 h-16 resize-none shadow-inner"
                      placeholder="What does this variable control?"
                      value={newSetting.description}
                      onChange={e => setNewSetting({...newSetting, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="relative z-10 flex gap-3 mt-6">
                   <Button 
                    variant="ghost" 
                    className="flex-1 rounded-xl h-11 text-slate-500 font-bold uppercase tracking-wider text-[10px] hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Abort
                  </Button>
                  <Button 
                    className="flex-[2] rounded-xl h-11 bg-[#0A2E1F] hover:bg-[#124430] text-white font-bold uppercase tracking-wider text-[10px] shadow-md shadow-emerald-950/20 hover:scale-[1.01] transition-all cursor-pointer"
                    onClick={handleAdd}
                  >
                    Sync to Matrix
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Destructive Action Modal */}
        <AnimatePresence>
          {deleteConfirmTarget && (
            <div className="fixed inset-0 z-[110] overflow-y-auto p-4 md:p-10 flex justify-center items-start md:items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmTarget(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative z-[111] my-auto w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl p-8 border border-slate-100"
              >
                {/* Close Button 'X' */}
                <button
                  onClick={() => {
                    setDeleteConfirmTarget(null);
                    setTypedConfirmName("");
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer z-20"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm">
                    <AlertCircle className="h-7 w-7 text-rose-600" />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold tracking-tight text-slate-800">Expunge Variable?</h3>
                    <p className="text-xs text-rose-600 font-bold uppercase tracking-wider mt-0.5">Destructive action</p>
                  </div>
                </div>

                <div className="relative z-10 mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-left shadow-inner">
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">
                    Warning: You are about to permanently delete the configuration variable <strong className="font-bold text-rose-600">"{deleteConfirmTarget.key}"</strong>. This will permanently expunge the variable from the global system matrix and might cause downstream pipeline interruptions.
                  </p>
                </div>

                <div className="relative z-10 mt-6 space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                    Type <span className="font-mono font-bold text-rose-600">{deleteConfirmTarget.key}</span> to authorize:
                  </label>
                  <input
                    type="text"
                    value={typedConfirmName}
                    onChange={(e) => setTypedConfirmName(e.target.value)}
                    placeholder={deleteConfirmTarget.key}
                    className="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-600 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all shadow-inner"
                  />
                </div>

                <div className="relative z-10 mt-8 flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteConfirmTarget(null);
                      setTypedConfirmName("");
                    }}
                    className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
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
                    className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] shadow-md shadow-rose-500/20 disabled:opacity-50 disabled:grayscale transition-all cursor-pointer"
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
