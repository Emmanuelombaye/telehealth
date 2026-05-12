import { useState, useMemo } from "react";
import { BookOpen, Search, Send, Video, FileText, CheckCircle2, ChevronRight, X, Eye, Bookmark, Share2, Sparkles, Filter, Database, Users, ArrowUpRight, Plus, RefreshCw, Shield } from "lucide-react";
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
  const [sending, setSending] = useState(false);

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
        // Mock patient ID for now (Alice Thompson)
        patient_id: 'd3111862-1000-4000-a000-000000000000' 
      });

      if (error) throw error;
      
      toast.success(`"${selectedContent.title}" has been successfully shared and recorded in EHR.`);
    } catch (e) {
      console.error(e);
      toast.error("Deployment failed. System could not reach clinical database.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-24 animate-in fade-in duration-1000">
      
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                <BookOpen className="h-6 w-6" />
             </div>
             <h1 className="text-3xl font-black text-[#0A2E1F] tracking-tight uppercase">
               Clinical Education <span className="text-emerald-500 italic font-serif lowercase tracking-tighter">library.</span>
             </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">Deploy high-fidelity care plans and verified medical insights to patient portals.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[10px] gap-2">
              <Bookmark className="h-4 w-4" /> Bookmarks
           </Button>
           <Button className="h-12 px-6 rounded-2xl bg-[#0A2E1F] text-white font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-emerald-900/10">
              <Plus className="h-4 w-4" /> Create Resource
           </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-10 items-start">
        
        {/* ── LEFT: DISCOVERY & FILTERING ─────────────────────────────────────────── */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* SEARCH & FILTERS */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
             <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search symptoms, conditions, or clinical protocols..." 
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-3xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                />
             </div>

             <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 pr-4 mr-2 border-r border-slate-100">
                   <Filter className="h-4 w-4 text-slate-400" />
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      selectedCategory === cat 
                        ? "bg-[#0A2E1F] text-white shadow-lg shadow-emerald-900/20 scale-105" 
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          {/* CONTENT LIST */}
          <div className="grid grid-cols-1 gap-4">
             <AnimatePresence mode="popLayout">
               {filteredLibrary.length > 0 ? (
                 filteredLibrary.map((item) => (
                   <motion.div
                     key={item.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className={cn(
                        "group p-6 bg-white border rounded-[2.5rem] transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6",
                        selectedContent?.id === item.id ? "border-emerald-500 ring-4 ring-emerald-50" : "border-slate-100"
                     )}
                     onClick={() => setSelectedContent(item)}
                   >
                     <div className="flex gap-6 items-center flex-1">
                       <div className={cn(
                         "h-16 w-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                         selectedContent?.id === item.id ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400"
                       )}>
                         <item.icon className="h-7 w-7" />
                       </div>
                       <div className="space-y-1">
                         <div className="flex items-center gap-3">
                            <p className="font-black text-base text-[#0A2E1F] uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{item.title}</p>
                            <Badge variant="outline" className="rounded-lg text-[8px] font-black uppercase tracking-widest border-slate-100 text-slate-400">
                               {item.readTime}
                            </Badge>
                         </div>
                         <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-xl">{item.description}</p>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-3 shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setSelectedContent(item); setShowPreview(true); }}
                          className="h-11 px-5 rounded-2xl border-slate-100 text-[#0A2E1F] font-bold uppercase tracking-widest text-[9px] gap-2 hover:bg-slate-50"
                        >
                           <Eye className="h-4 w-4" /> Preview
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setSelectedContent(item); }}
                          className={cn(
                            "h-11 px-5 rounded-2xl font-bold uppercase tracking-widest text-[9px] gap-2 transition-all",
                            selectedContent?.id === item.id ? "bg-emerald-500 text-white" : "bg-[#0A2E1F] text-white"
                          )}
                        >
                           {selectedContent?.id === item.id ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                           {selectedContent?.id === item.id ? "Selected" : "Select"}
                        </Button>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="py-20 text-center space-y-4 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                       <Search className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No protocols found matching your criteria</p>
                    <Button variant="ghost" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }} className="text-emerald-600 font-black uppercase text-[10px] tracking-widest">Clear All Filters</Button>
                 </div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: DEPLOYMENT COMMAND ────────────────────────────────────────── */}
        <div className="xl:col-span-4 sticky top-24">
           <Card className="border-none shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] rounded-[3.5rem] bg-white overflow-hidden relative group">
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#0A2E1F]" />
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-1000" />
              
              <CardHeader className="p-10 pb-6 border-b border-slate-50 relative z-10">
                <div className="flex items-center justify-between mb-2">
                   <CardTitle className="text-xl font-black text-[#0A2E1F] uppercase tracking-tight">Deploy Content</CardTitle>
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-xs font-semibold text-slate-400">Ready for instant patient portal delivery.</p>
              </CardHeader>

              <CardContent className="p-10 space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recipient</label>
                     <Badge variant="ghost" className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Recent Patient
                     </Badge>
                  </div>
                  <select className="w-full border-2 border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold bg-slate-50 text-[#0A2E1F] outline-none focus:border-emerald-500/20 transition-all cursor-pointer appearance-none">
                    <option>Alice Thompson (Active Order)</option>
                    <option>Robert Wilson (Chronic Care)</option>
                    <option>Marcus Aurelius (Physical Therapy)</option>
                    <option>Search Global EHR...</option>
                  </select>
                </div>

                <AnimatePresence mode="wait">
                  {selectedContent ? (
                    <motion.div 
                      key={selectedContent.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 space-y-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
                           <selectedContent.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-0.5">Selected Protocol</p>
                          <p className="text-sm font-bold text-[#0A2E1F] leading-tight line-clamp-2">{selectedContent.title}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-100/50">
                         <div className="flex items-center gap-2">
                            <Database className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Portal Integrated</span>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => setSelectedContent(null)} className="h-6 px-3 text-red-500 hover:text-red-600 font-bold uppercase text-[8px] tracking-widest">
                            Remove
                         </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="p-8 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-3">
                       <BookOpen className="h-8 w-8 text-slate-100" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select material from the library to begin</p>
                    </div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                   <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[11px] text-[#0A2E1F] uppercase tracking-tight">Cloud Delivery Synchronized</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Content is push-notified to the patient and available offline in their Peak Health wallet.</p>
                      </div>
                   </div>

                   <Button 
                     disabled={!selectedContent || sending}
                     onClick={handleSend}
                     className="w-full h-16 rounded-3xl bg-[#0A2E1F] hover:bg-[#062015] text-white font-black uppercase tracking-[0.2em] text-[12px] gap-3 shadow-2xl shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                   >
                     {sending ? (
                       <RefreshCw className="h-5 w-5 animate-spin" />
                     ) : (
                       <Send className="h-5 w-5" />
                     )}
                     {sending ? "Delivering..." : "Deploy to Patient Portal"}
                   </Button>
                </div>
              </CardContent>
           </Card>

           {/* SYSTEM LOG */}
           <div className="mt-8 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                 <Shield className="h-3 w-3" /> HIPAA SECURE CHANNEL
              </p>
              <div className="flex items-center gap-1.5">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">Ready</span>
              </div>
           </div>
        </div>

      </div>

      {/* ── PREVIEW MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {showPreview && selectedContent && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-[#0A2E1F]/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[4rem] overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
               <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-[#0A2E1F] text-white flex items-center justify-center">
                        <selectedContent.icon className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Clinical Preview</p>
                        <h3 className="text-xl font-black text-[#0A2E1F] uppercase tracking-tight">{selectedContent.title}</h3>
                     </div>
                  </div>
                  <button onClick={() => setShowPreview(false)} className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors">
                     <X className="h-6 w-6 text-slate-400" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                  <div className="grid md:grid-cols-3 gap-8">
                     <div className="md:col-span-2 space-y-6">
                        <div className="aspect-video rounded-[2.5rem] bg-slate-100 flex items-center justify-center relative group overflow-hidden border border-slate-200">
                           {selectedContent.type === "Video" || selectedContent.type === "Workshop" ? (
                             <>
                               <Video className="h-16 w-16 text-slate-300 group-hover:scale-110 transition-transform" />
                               <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                     <div className="h-0 w-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                                  </div>
                               </div>
                             </>
                           ) : (
                             <FileText className="h-16 w-16 text-slate-300" />
                           )}
                           <div className="absolute top-6 left-6 flex gap-2">
                              <Badge className="bg-[#0A2E1F] text-white border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedContent.type}</Badge>
                              <Badge className="bg-white/80 backdrop-blur-md text-[#0A2E1F] border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedContent.category}</Badge>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-2xl font-black text-[#0A2E1F] tracking-tight">Clinical Overview</h4>
                           <p className="text-slate-600 leading-relaxed font-medium">
                              {selectedContent.description} This material has been reviewed by the Clinical Advisory Board and is compliant with the latest precision telehealth protocols.
                           </p>
                           <div className="p-8 rounded-3xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Protocol Highlights</p>
                              <ul className="grid grid-cols-2 gap-3">
                                 {["Evidence-based", "Visual aids included", "Step-by-step instructions", "Follow-up triggers"].map(li => (
                                    <li key={li} className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                                       <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {li}
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-6">
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata</p>
                              <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Duration</span>
                                    <span className="text-xs font-black text-[#0A2E1F] uppercase tracking-tighter">{selectedContent.readTime}</span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Version</span>
                                    <span className="text-xs font-black text-[#0A2E1F] uppercase tracking-tighter">v2.4.1</span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Updated</span>
                                    <span className="text-xs font-black text-[#0A2E1F] uppercase tracking-tighter">{selectedContent.lastUpdated}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="h-px bg-slate-200" />
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</p>
                              <div className="grid grid-cols-1 gap-3">
                                 <Button className="w-full h-12 rounded-2xl bg-[#0A2E1F] text-white font-black uppercase text-[9px] tracking-widest gap-2">
                                    <Share2 className="h-3.5 w-3.5" /> External Link
                                 </Button>
                                 <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-200 text-slate-600 font-black uppercase text-[9px] tracking-widest gap-2">
                                    <ArrowUpRight className="h-3.5 w-3.5" /> Source Documentation
                                 </Button>
                              </div>
                           </div>
                        </div>
                        
                        <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex gap-4">
                           <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                              <Users className="h-5 w-5 text-blue-600" />
                           </div>
                           <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                              This resource is currently popular among patients with similar profiles to your queue.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                  <Button variant="outline" onClick={() => setShowPreview(false)} className="h-12 px-8 rounded-2xl border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Close Preview</Button>
                  <Button 
                    onClick={() => { setShowPreview(false); handleSend(); }}
                    className="h-12 px-10 rounded-2xl bg-emerald-500 text-[#0A2E1F] font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="h-4 w-4" /> Send to Patient Now
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
