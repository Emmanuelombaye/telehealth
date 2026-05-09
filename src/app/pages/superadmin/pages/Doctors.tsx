import { useState } from "react";
import {
  Users, Search, Filter, Edit2, ShieldOff, Shield,
  ChevronDown, UserCheck, Building2, Eye, Stethoscope, Plus, X, Upload, CheckCircle2, MoreHorizontal, Globe, Award, Clipboard
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { motion, AnimatePresence } from "framer-motion";

const doctors = [
  { id: 1, name: "Dr. Sarah Johnson", email: "sarah.j@peakhealth.com", specialty: "Dermatology", npi: "1234567890", status: "active", joined: "Dec 1, 2025", patients: 142, rating: 4.9, avatar: "SJ" },
  { id: 2, name: "Dr. Michael Chen", email: "m.chen@peakhealth.com", specialty: "General Practice", npi: "9876543210", status: "active", joined: "Nov 15, 2025", patients: 89, rating: 4.8, avatar: "MC" },
  { id: 3, name: "Dr. Emily Stone", email: "e.stone@peakhealth.com", specialty: "Weight Loss", npi: "4567890123", status: "pending", joined: "Apr 20, 2026", patients: 0, rating: 0, avatar: "ES" },
  { id: 4, name: "Dr. Marcus Thorne", email: "m.thorne@peakhealth.com", specialty: "Men's Health", npi: "7890123456", status: "active", joined: "Jan 10, 2026", patients: 215, rating: 5.0, avatar: "MT" },
];

export function SuperAdminDoctorsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [search, setSearch] = useState("");

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

      {/* Stats row with "Clean Branded Green" look */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Providers", value: "248", icon: Stethoscope, color: "text-[#22c55e]", bg: "bg-[#22c55e]/5" },
          { label: "Pending Credentials", value: "12", icon: Clipboard, color: "text-amber-500", bg: "bg-amber-500/5" },
          { label: "Total Consultations", value: "14.2k", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/5" },
          { label: "Avg. Patient Rating", value: "4.92", icon: Award, color: "text-emerald-400", bg: "bg-emerald-400/5" },
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

      {/* Doctor Cards - "Attractive Seamless" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((doc, idx) => (
          <motion.div
            key={doc.id}
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
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tight text-[#e2e8f0] group-hover:text-[#22c55e] transition-colors">{doc.name}</h3>
                        <p className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.2em] mt-1">{doc.specialty}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase tracking-widest border-none px-3 py-1 rounded-full",
                        doc.status === 'active' ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {doc.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <p className="text-[9px] font-black text-[#4f6458] uppercase tracking-widest mb-0.5">NPI Number</p>
                        <p className="text-xs font-bold text-[#7f9488] font-mono">{doc.npi}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[#4f6458] uppercase tracking-widest mb-0.5">Patients</p>
                        <p className="text-xs font-bold text-[#e2e8f0]">{doc.patients} Total</p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#4f6458]">
                         <Globe className="h-3.5 w-3.5" />
                         <span className="text-[10px] font-black uppercase tracking-tight">Multi-State Licensed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-[#22c55e]/10 text-[#7f9488] hover:text-[#22c55e]">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-red-500/10 text-[#7f9488] hover:text-red-500">
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
                      placeholder="Dr. Jane Smith"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="jane.smith@telehealth.os"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>

                  {/* Profile Photo */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Photo</label>
                    <div className="relative group">
                      <input type="file" className="hidden" id="photo-upload" />
                      <label htmlFor="photo-upload" className="flex items-center gap-3 w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium cursor-pointer hover:bg-slate-50 transition-all">
                        <span className="bg-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Choose File</span>
                        <span className="text-slate-400">No file chosen</span>
                      </label>
                    </div>
                  </div>
                  {/* Calendly */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calendly (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="https://calendly.com/dr-smith"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>

                  {/* NPI Number */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NPI Number</label>
                    <input 
                      type="text" 
                      placeholder="10-digit ID"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>
                  {/* Specialty */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Specialty</label>
                    <div className="relative">
                      <select className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 appearance-none transition-all">
                        <option>Select Specialty...</option>
                        <option>Dermatology</option>
                        <option>General Practice</option>
                        <option>Weight Loss</option>
                        <option>Men's Health</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Credentials */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medical Credentials</label>
                    <input 
                      type="text" 
                      placeholder="MD, FAAFP"
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#0a2e1f] focus:ring-4 focus:ring-[#0a2e1f]/5 transition-all"
                    />
                  </div>
                  {/* Licensed States */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Licensed States</label>
                    <input 
                      type="text" 
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
                    onClick={() => setShowInviteModal(false)}
                    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                   >
                     Cancel
                   </button>
                   <Button className="rounded-full h-16 px-16 bg-[#0a2e1f] hover:bg-[#061c13] text-white font-bold text-base shadow-2xl shadow-[#0a2e1f]/20">
                     Send Invitation
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
