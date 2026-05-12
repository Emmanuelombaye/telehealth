import { useState, useMemo } from "react";
import { BookOpen, Search, Send, Video, FileText, CheckCircle2, ChevronRight, ChevronDown, X, Eye, Bookmark, Share2, Sparkles, Filter, Database, Users, ArrowUpRight, Plus, RefreshCw, Shield, Type, Layers, Globe, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

const educationLibrary = [
  { 
    id: 1,
    title: "Managing Hypertension with Diet (DASH Diet)", 
    type: "Article", 
    icon: FileText, 
    category: "Cardiology",
    description: "A comprehensive guide on Dietary Approaches to Stop Hypertension, focusing on sodium reduction and nutrient-rich protocols.",
    readTime: "8 min",
    lastUpdated: "May 2026"
  },
  { 
    id: 2,
    title: "Lower Back Pain Stretching Routine", 
    type: "Video", 
    icon: Video, 
    category: "Physical Therapy",
    description: "Precision-guided stretching protocols designed to decompress the lumbar spine and strengthen core stabilizers.",
    readTime: "12 min video",
    lastUpdated: "Apr 2026"
  },
  { 
    id: 3,
    title: "Understanding Type 2 Diabetes", 
    type: "Article", 
    icon: FileText, 
    category: "Endocrinology",
    description: "Clinical breakdown of insulin resistance, glucose monitoring, and long-term metabolic health strategies.",
    readTime: "15 min",
    lastUpdated: "June 2026"
  },
  { 
    id: 4,
    title: "Post-Concussion Rest Guidelines", 
    type: "Care Plan", 
    icon: FileText, 
    category: "Neurology",
    description: "Step-by-step cognitive and physical rest protocols for the first 72 hours following a head injury.",
    readTime: "5 min",
    lastUpdated: "Mar 2026"
  },
  { 
    id: 5,
    title: "Anxiety Management: Cognitive Reset", 
    type: "Workshop", 
    icon: Video, 
    category: "Mental Health",
    description: "Advanced neuro-cognitive techniques for rapid anxiety reduction and baseline emotional stabilization.",
    readTime: "20 min video",
    lastUpdated: "May 2026"
  },
  { 
    id: 6,
    title: "Sustainable Weight Loss: GLP-1 Protocol", 
    type: "Care Plan", 
    icon: Sparkles, 
    category: "Diet & Nutrition",
    description: "Medical-grade nutritional strategy to complement GLP-1 medications and ensure muscle mass preservation.",
    readTime: "10 min",
    lastUpdated: "June 2026"
  }
];

const categories = ["All", "Cardiology", "Diet & Nutrition", "Physical Therapy", "Mental Health", "Neurology", "Endocrinology"];

export function DoctorEducationPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedContent, setSelectedContent] = useState<any>(educationLibrary[0]);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProtocol, setNewProtocol] = useState({ title: "", category: "Cardiology", type: "Article", description: "" });

  // Filtered Library Logic
  const filteredLibrary = useMemo(() => {
    return educationLibrary.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleSend = async () => {
    if (!selectedContent) return;
    setSending(true);
    
    try {
      const { error } = await supabase.from('shared_resources').insert({
        title: selectedContent.title,
        type: selectedContent.type,
        category: selectedContent.category,
        doctor_id: user?.id,
        patient_id: 'd3111862-1000-4000-a000-000000000000' 
      });

      if (error) throw error;
      toast.success(`"${selectedContent.title}" shared successfully.`);
    } catch (e) {
      toast.error("Deployment failed. System offline.");
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    const link = `https://peak-health.io/protocol/${selectedContent?.id || 'public'}`;
    navigator.clipboard.writeText(link);
    toast.success("Protocol Link copied to clipboard. Ready for secure sharing.");
  };

  const handleDownloadPDF = () => {
    toast.info("Generating Clinical PDF Record...");
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const handleCreateResource = async () => {
    if (!newProtocol.title) {
      toast.error("Please provide a protocol title.");
      return;
    }
    setCreating(true);
    
    try {
      const { error } = await supabase.from('clinical_protocols').insert({
        ...newProtocol,
        created_by: user?.id
      });

      if (error) throw error;

      toast.success(`"${newProtocol.title}" has been indexed and published to the clinic library.`);
      setShowCreateModal(false);
      setNewProtocol({ title: "", category: "Cardiology", type: "Article", description: "" });
    } catch (e) {
      console.error(e);
      toast.error("Indexing failed. Database connection error.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-24 animate-in fade-in duration-1000 px-4 md:px-8">
      
      {/* ── TOP-NOTCH HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-white/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-[1.25rem] bg-[#0A2E1F] flex items-center justify-center text-white shadow-xl shadow-emerald-900/20">
                <BookOpen className="h-6 w-6" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-[#0A2E1F] tracking-tighter uppercase leading-none">
                  Clinical <span className="text-emerald-500 italic font-serif lowercase tracking-tighter">education.</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Authorized Library & Deployment Hub</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <Button variant="outline" className="flex-1 lg:flex-none h-14 px-8 rounded-2xl border-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-slate-50 transition-all active:scale-95">
              <Bookmark className="h-4 w-4" /> Bookmarks
           </Button>
           <Button 
             onClick={() => setShowCreateModal(true)}
             className="flex-1 lg:flex-none h-14 px-10 rounded-2xl bg-[#0A2E1F] text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-[0_20px_40px_rgba(10,46,31,0.2)] transition-all hover:scale-105 active:scale-95 group"
           >
              <Plus className="h-5 w-5 text-emerald-400 group-hover:rotate-90 transition-transform" /> Create Resource
           </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-10 items-start">
        
        {/* ── LEFT: DISCOVERY COMMAND ─────────────────────────────────────────── */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* SEARCH & REFINED CATEGORY GRID */}
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-50 space-y-8">
             <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-emerald-500 transition-all" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search symptoms, conditions, or clinical protocols..." 
                  className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] text-[15px] font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500/10 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                />
             </div>

             {/* WRAPPING CATEGORY GRID (NO CLIPPING) */}
             <div className="flex flex-wrap items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mr-2 shrink-0 border border-slate-100">
                   <Filter className="h-4 w-4" />
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      selectedCategory === cat 
                        ? "bg-[#0A2E1F] text-white shadow-xl shadow-emerald-900/30 scale-105 z-10" 
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
                    )}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          {/* CONTENT COMMANDS */}
          <div className="grid grid-cols-1 gap-6">
             <AnimatePresence mode="popLayout">
               {filteredLibrary.length > 0 ? (
                 filteredLibrary.map((item) => (
                   <motion.div
                     key={item.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={cn(
                        "group p-8 bg-white border-2 rounded-[3rem] transition-all cursor-pointer relative overflow-hidden",
                        selectedContent?.id === item.id 
                          ? "border-emerald-500 shadow-2xl shadow-emerald-900/10" 
                          : "border-slate-50 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50"
                     )}
                     onClick={() => setSelectedContent(item)}
                   >
                     {selectedContent?.id === item.id && (
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                     )}
                     
                     <div className="flex flex-col md:flex-row gap-8 items-center justify-between relative z-10">
                       <div className="flex gap-8 items-center flex-1 w-full">
                         <div className={cn(
                           "h-20 w-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-6",
                           selectedContent?.id === item.id ? "bg-[#0A2E1F] text-emerald-400 shadow-xl" : "bg-slate-50 text-slate-300"
                         )}>
                           <item.icon className="h-9 w-9" />
                         </div>
                         <div className="space-y-2 flex-1">
                           <div className="flex flex-wrap items-center gap-3">
                              <p className="font-black text-lg text-[#0A2E1F] uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{item.title}</p>
                              <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-widest border-slate-100 text-slate-300 bg-white">
                                 {item.readTime}
                              </Badge>
                           </div>
                           <p className="text-[13px] text-slate-400 font-bold leading-relaxed max-w-xl group-hover:text-slate-500 transition-colors">{item.description}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                          <Button 
                            variant="outline" 
                            onClick={(e) => { e.stopPropagation(); setSelectedContent(item); setShowPreview(true); }}
                            className="flex-1 md:flex-none h-14 px-8 rounded-2xl border-slate-100 text-[#0A2E1F] font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-[#0A2E1F] hover:text-white transition-all shadow-sm active:scale-95"
                          >
                             <Eye className="h-5 w-5" /> Preview
                          </Button>
                          <button 
                            className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center transition-all active:scale-90",
                              selectedContent?.id === item.id ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                            )}
                          >
                             {selectedContent?.id === item.id ? <CheckCircle2 className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                          </button>
                       </div>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="py-32 text-center space-y-6 bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-100">
                    <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
                       <Search className="h-10 w-10 text-slate-100" />
                    </div>
                    <div>
                       <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No matching clinical protocols</p>
                       <p className="text-xs text-slate-300 mt-2">Try adjusting your filters or search terms.</p>
                    </div>
                    <Button variant="ghost" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }} className="text-emerald-600 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 px-8 py-3 rounded-xl">Clear All Filters</Button>
                 </div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: DEPLOYMENT SUITE ────────────────────────────────────────── */}
        <div className="xl:col-span-4 space-y-8 sticky top-24">
           <Card className="border-none shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] rounded-[4rem] bg-white overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-600 to-emerald-400" />
              
              <CardHeader className="p-12 pb-8 relative z-10">
                <div className="flex items-center justify-between mb-2">
                   <CardTitle className="text-2xl font-black text-[#0A2E1F] uppercase tracking-tighter">Deploy Center</CardTitle>
                   <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Share2 className="h-5 w-5" />
                   </div>
                </div>
                <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest opacity-60">Authorized Patient Delivery Channel</p>
              </CardHeader>

              <CardContent className="p-12 pt-0 space-y-10 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Patient Link</label>
                     <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <Users className="h-3 w-3" /> Active Link
                     </span>
                  </div>
                  <div className="relative">
                    <select className="w-full border-2 border-slate-50 rounded-[1.5rem] px-8 py-5 text-[14px] font-black bg-slate-50 text-[#0A2E1F] outline-none focus:bg-white focus:border-emerald-500/20 transition-all cursor-pointer appearance-none">
                      <option>Alice Thompson (Active Order)</option>
                      <option>Robert Wilson (Chronic Care)</option>
                      <option>Search EHR Network...</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {selectedContent ? (
                    <motion.div 
                      key={selectedContent.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 rounded-[2.5rem] bg-[#0A2E1F] text-white space-y-6 shadow-2xl shadow-emerald-900/30 border border-white/5"
                    >
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                           <selectedContent.icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">Queued Protocol</p>
                          <p className="text-sm font-black leading-tight uppercase tracking-tight">{selectedContent.title}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                         <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Portal Integrated</span>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => setSelectedContent(null)} className="h-6 px-3 text-red-400 hover:text-red-500 font-black uppercase text-[8px] tracking-widest hover:bg-white/5">
                            Cancel
                         </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="p-10 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                       <Layers className="h-10 w-10 text-slate-100" />
                       <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Select material from the library to deploy</p>
                    </div>
                  )}
                </AnimatePresence>

                <div className="space-y-6 pt-4">
                   <div className="flex items-start gap-5 p-6 rounded-[2rem] bg-emerald-50/50 border border-emerald-100">
                      <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                         <ShieldCheck className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-black text-[12px] text-[#0A2E1F] uppercase tracking-tight">HIPAA Cloud Delivery</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">Content is encrypted and push-notified to the patient dashboard immediately.</p>
                      </div>
                   </div>

                   <Button 
                     disabled={!selectedContent || sending}
                     onClick={handleSend}
                     className="w-full h-20 rounded-[2rem] bg-[#0A2E1F] hover:bg-[#062015] text-white font-black uppercase tracking-[0.3em] text-[13px] gap-4 shadow-2xl shadow-emerald-900/40 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                   >
                     {sending ? (
                       <RefreshCw className="h-6 w-6 animate-spin" />
                     ) : (
                       <Send className="h-6 w-6 text-emerald-400" />
                     )}
                     {sending ? "Delivering..." : "Deploy to Patient"}
                   </Button>
                </div>
              </CardContent>
           </Card>
        </div>

      </div>

      {/* ── CREATE RESOURCE MODAL (LIVE ENGINE) ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-[#0A2E1F]/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 flex flex-col overflow-hidden max-h-[min(90vh,800px)] border border-white/20"
            >
               <div className="p-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                        <Plus className="h-6 w-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-[#0A2E1F] uppercase tracking-tighter">Create Protocol</h3>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Clinical Indexing Terminal</p>
                     </div>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                     <X className="h-5 w-5" />
                  </button>
               </div>

               <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Protocol Title</label>
                     <div className="relative">
                        <Type className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-200" />
                        <input 
                          type="text" 
                          value={newProtocol.title}
                          onChange={(e) => setNewProtocol({ ...newProtocol, title: e.target.value })}
                          placeholder="e.g. Post-Op Wound Care Instructions" 
                          className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl text-sm font-bold border-none focus:ring-4 focus:ring-emerald-500/5 outline-none" 
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Category</label>
                        <select 
                          value={newProtocol.category}
                          onChange={(e) => setNewProtocol({ ...newProtocol, category: e.target.value })}
                          className="w-full bg-slate-50 px-6 py-5 rounded-2xl text-sm font-bold border-none outline-none"
                        >
                           {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Format</label>
                        <select 
                          value={newProtocol.type}
                          onChange={(e) => setNewProtocol({ ...newProtocol, type: e.target.value })}
                          className="w-full bg-slate-50 px-6 py-5 rounded-2xl text-sm font-bold border-none outline-none"
                        >
                           <option>Article</option>
                           <option>Video</option>
                           <option>Care Plan</option>
                        </select>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Description</label>
                     <textarea 
                        value={newProtocol.description}
                        onChange={(e) => setNewProtocol({ ...newProtocol, description: e.target.value })}
                        placeholder="Provide clinical context for the doctor..." 
                        className="w-full bg-slate-50 px-8 py-6 rounded-3xl text-sm font-bold border-none h-32 resize-none outline-none focus:ring-4 focus:ring-emerald-500/5" 
                     />
                  </div>
               </div>

               <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-6 sticky bottom-0 z-20">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancel</Button>
                  <Button 
                    onClick={handleCreateResource}
                    disabled={creating}
                    className="h-14 px-10 rounded-2xl bg-[#0A2E1F] text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
                  >
                    {creating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
                    {creating ? "Indexing..." : "Index Protocol"}
                  </Button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PREVIEW MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {showPreview && selectedContent && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-[#0A2E1F]/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-5xl rounded-[4rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.5)] relative z-10 flex flex-col overflow-hidden max-h-[min(90vh,850px)] border border-white/20"
            >
               <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
                  <div className="flex items-center gap-6">
                     <div className="h-14 w-14 rounded-[1.25rem] bg-[#0A2E1F] text-white flex items-center justify-center shadow-xl">
                        <selectedContent.icon className="h-7 w-7 text-emerald-400" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-0.5">Clinical Protocol Preview</p>
                        <h3 className="text-2xl font-black text-[#0A2E1F] uppercase tracking-tighter leading-none">{selectedContent.title}</h3>
                     </div>
                  </div>
                  <button onClick={() => setShowPreview(false)} className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-90">
                     <X className="h-7 w-7" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-white">
                  <div className="grid lg:grid-cols-3 gap-12">
                     <div className="lg:col-span-2 space-y-8">
                        <div className="aspect-video rounded-[3rem] bg-[#0A0D14] flex items-center justify-center relative group overflow-hidden border-8 border-slate-50">
                           {selectedContent.type === "Video" || selectedContent.type === "Workshop" ? (
                             <>
                               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173bdb999ef?auto=format&fit=crop&q=80')] opacity-30 bg-cover bg-center" />
                               <Video className="h-20 w-20 text-white relative z-10 group-hover:scale-110 transition-transform opacity-50" />
                               <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl">
                                     <div className="h-0 w-0 border-t-[12px] border-t-transparent border-l-[22px] border-l-white border-b-[12px] border-b-transparent ml-2" />
                                  </div>
                               </div>
                             </>
                           ) : (
                             <FileText className="h-24 w-24 text-slate-700" />
                           )}
                           <div className="absolute top-8 left-8 flex gap-3 z-30">
                              <Badge className="bg-emerald-500 text-white border-none px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">{selectedContent.type}</Badge>
                              <Badge className="bg-white text-[#0A2E1F] border-none px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/5">{selectedContent.category}</Badge>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <h4 className="text-3xl font-black text-[#0A2E1F] tracking-tighter uppercase">Protocol Insights</h4>
                           <p className="text-[17px] text-slate-500 leading-relaxed font-bold">
                              {selectedContent.description} This medical-grade material is optimized for patient retention and adherence. Indexing ensures this protocol is cross-referenced with your clinic's prescription standards.
                           </p>
                           <div className="grid grid-cols-2 gap-4">
                              {["Cloud-Ready", "Multi-Language", "Interactive Elements", "Auto-Sync"].map(li => (
                                 <div key={li} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <span className="text-xs font-black text-[#0A2E1F] uppercase tracking-widest">{li}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <div className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 space-y-8">
                           <div className="space-y-6">
                              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Metadata Analysis</p>
                              <div className="space-y-4">
                                 {[
                                   { label: "Clinical Duration", val: selectedContent.readTime, icon: RefreshCw },
                                   { label: "Deployment Engine", val: "v4.0 Matrix", icon: Globe },
                                   { label: "Last Audit", val: selectedContent.lastUpdated, icon: Shield }
                                 ].map(m => (
                                   <div key={m.label} className="flex items-center justify-between group/meta">
                                      <div className="flex items-center gap-3">
                                         <m.icon className="h-4 w-4 text-slate-300 group-hover/meta:text-emerald-500 transition-colors" />
                                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{m.label}</span>
                                      </div>
                                      <span className="text-[11px] font-black text-[#0A2E1F] uppercase tracking-tighter">{m.val}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           <div className="h-px bg-slate-200" />
                           <div className="space-y-4">
                              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">External Actions</p>
                              <div className="grid grid-cols-1 gap-4">
                                 <Button 
                                   onClick={handleCopyLink}
                                   className="w-full h-14 rounded-2xl bg-[#0A2E1F] text-white font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg active:scale-95 transition-all"
                                 >
                                    <Share2 className="h-4 w-4 text-emerald-400" /> Public Access Link
                                 </Button>
                                 <Button 
                                   variant="outline" 
                                   onClick={handleDownloadPDF}
                                   className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-slate-50 transition-all active:scale-95"
                                 >
                                    <ArrowUpRight className="h-4 w-4" /> Download PDF Record
                                 </Button>
                              </div>
                           </div>
                        </div>
                        
                        <div className="p-8 rounded-[2.5rem] bg-[#0A2E1F] border border-white/10 flex flex-col gap-6 shadow-2xl">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                 <Users className="h-6 w-6 text-emerald-400" />
                              </div>
                              <p className="text-[11px] font-black text-white uppercase tracking-widest leading-relaxed">
                                 Deployed 430+ times this month.
                              </p>
                           </div>
                           <p className="text-[10px] font-medium text-white/40 leading-relaxed uppercase tracking-widest">Highly effective for metabolic patients.</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-6 sticky bottom-0 z-20">
                  <Button variant="ghost" onClick={() => setShowPreview(false)} className="text-slate-400 font-black uppercase text-[10px] tracking-widest px-8 hover:text-slate-600 transition-colors">Dismiss</Button>
                  <Button 
                    onClick={() => { setShowPreview(false); handleSend(); }}
                    className="h-16 px-14 rounded-2xl bg-emerald-500 text-[#0A2E1F] font-black uppercase tracking-[0.3em] text-[11px] gap-4 shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                  >
                    <Send className="h-5 w-5" /> Deploy Resource
                  </Button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.3); }
      `}} />

    </div>
  );
}
