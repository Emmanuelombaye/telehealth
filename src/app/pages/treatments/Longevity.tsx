import { motion } from "framer-motion";
import { 
  CheckCircle2, ArrowRight, ShieldCheck, Zap, 
  Activity, Star, Clock, Heart, FlaskConical, 
  Sparkles, TrendingUp, RefreshCw, Layers,
  Dna, Cpu, Microscope
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../../components/ui/shared";
import { Reveal } from "../../components/ui/Reveal";

export function LongevityPage() {
  return (
    <div className="bg-white text-[#0A0D14] overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-[#F9FAFB]">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.05),transparent)] -z-10" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Reveal direction="right">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                🧬 Cellular Optimization · Next-Gen Peptides
              </Badge>
            </Reveal>
            <Reveal direction="right" delay={0.3}>
              <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tight">
                Don't just age. <br/><span className="text-emerald-600 italic font-serif tracking-normal">Optimize.</span>
              </h1>
            </Reveal>
            <Reveal direction="right" delay={0.4}>
              <p className="text-xl text-slate-500 font-medium max-w-xl">
                Advanced longevity protocols designed to repair cellular damage, boost metabolic health, and extend your performance window.
              </p>
            </Reveal>
            <Reveal direction="right" delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/patient/shop">
                  <Button className="h-16 px-10 rounded-2xl bg-[#0A0D14] text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-emerald-900/20 group">
                    Explore Longevity Stack <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3 px-4">
                  <Microscope className="h-5 w-5 text-slate-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Biotech Driven<br/>Clinical Protocols</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal direction="left" delay={0.4}>
            <div className="relative">
              <div className="absolute -inset-10 bg-emerald-500/10 rounded-[64px] blur-3xl animate-pulse" />
              <div className="relative bg-[#0A0D14] rounded-[64px] p-2 overflow-hidden shadow-2xl">
                 <img 
                  src="https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80" 
                  alt="Laboratory" 
                  className="rounded-[60px] w-full h-[600px] object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent" />
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-12 left-12 right-12 bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/10"
                >
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Cellular Age Index</p>
                  <div className="flex items-center justify-between">
                     <h3 className="text-3xl font-black text-white">Optimal</h3>
                     <Activity className="h-8 w-8 text-emerald-500" />
                  </div>
                </motion.div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. THE STACK SECTION */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-24 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">The Longevity Stack.</h2>
              <p className="text-lg text-slate-500 font-medium">Precision tools for biological maintenance.</p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-12">
            {[
              { 
                name: "NAD+ Therapy", 
                sub: "Cellular Energy & DNA Repair", 
                desc: "The 'Youth Molecule.' NAD+ is critical for mitochondrial health and repairing the DNA damage that causes aging.",
                icon: Dna,
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              { 
                name: "Peptide Program", 
                sub: "Growth Hormone Optimization", 
                desc: "Using Sermorelin and Ipamorelin to stimulate natural GH production, improving sleep, muscle mass, and recovery.",
                icon: Cpu,
                color: "text-emerald-500",
                bg: "bg-emerald-50"
              }
            ].map((item, i) => (
              <Reveal key={i} delay={0.2 * i} direction="up">
                 <Card className="border-none bg-slate-50 rounded-[48px] p-12 hover:-translate-y-2 transition-all duration-500 group">
                    <CardContent className="p-0 space-y-8">
                       <div className={cn("h-20 w-20 rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6", item.bg)}>
                          <item.icon className={cn("h-10 w-10", item.color)} />
                       </div>
                       <div className="space-y-4">
                          <h3 className="text-3xl font-black">{item.name}</h3>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{item.sub}</p>
                          <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                       </div>
                       <ul className="grid grid-cols-2 gap-4">
                          {["Metabolic Health", "Cognitive Focus", "Sleep Quality", "Lean Muscle"].map((f, j) => (
                            <li key={j} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {f}
                            </li>
                          ))}
                       </ul>
                    </CardContent>
                 </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SCIENTIFIC DEEP DIVE */}
      <section className="py-32 bg-[#0A0D14] text-white overflow-hidden rounded-[80px] mx-6">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
           <Reveal direction="right">
              <div className="space-y-8">
                 <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">CLINICAL SCIENCE</Badge>
                 <h2 className="text-5xl font-black leading-tight">The Science of <br/>Living <span className="text-emerald-400">Better.</span></h2>
                 <p className="text-xl text-slate-400 font-medium leading-relaxed">
                    We don't believe in 'anti-aging.' We believe in optimization. Our protocols target the 9 hallmarks of aging at a molecular level.
                 </p>
                 
                 <div className="space-y-6 pt-4">
                    {[
                      { t: "Mitochondrial Function", d: "Revive the energy centers of your cells." },
                      { t: "Telomere Support", d: "Protocols to maintain genetic structural integrity." },
                      { t: "Hormonal Balance", d: "Returning biological markers to their peak state." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 group">
                         <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-emerald-500 transition-colors">
                            <span className="text-xs font-black">0{i+1}</span>
                         </div>
                         <div>
                            <p className="font-black text-white">{item.t}</p>
                            <p className="text-sm text-slate-500 font-medium">{item.d}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </Reveal>

           <Reveal direction="left">
              <div className="relative p-1 bg-gradient-to-br from-emerald-500/40 to-blue-500/40 rounded-[48px]">
                 <div className="bg-[#0A0D14] p-12 rounded-[44px] space-y-12">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Zap className="h-6 w-6 text-emerald-500" />
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Protocol Recommendation</p>
                          <h4 className="text-xl font-black">Advanced Metabolic Stack</h4>
                       </div>
                    </div>
                    
                    <div className="space-y-6">
                       <div className="flex justify-between items-end border-b border-white/5 pb-6">
                          <div>
                             <p className="text-xs font-bold text-slate-400 mb-1">NAD+ Therapy</p>
                             <p className="text-lg font-black text-emerald-400">Included</p>
                          </div>
                          <Link to="/patient/shop">
                             <Button variant="ghost" className="text-xs font-black uppercase text-white hover:text-emerald-400">Details</Button>
                          </Link>
                       </div>
                       <div className="flex justify-between items-end border-b border-white/5 pb-6">
                          <div>
                             <p className="text-xs font-bold text-slate-400 mb-1">Custom Peptides</p>
                             <p className="text-lg font-black text-emerald-400">Sermorelin 9mg</p>
                          </div>
                          <Link to="/patient/shop">
                             <Button variant="ghost" className="text-xs font-black uppercase text-white hover:text-emerald-400">Details</Button>
                          </Link>
                       </div>
                    </div>

                    <Button className="w-full h-16 rounded-3xl bg-white text-[#0A0D14] font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-50 transition-all">
                       Explore The Stack
                    </Button>
                 </div>
              </div>
           </Reveal>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="py-32 bg-white px-6">
        <Reveal>
          <div className="max-w-5xl mx-auto bg-emerald-600 rounded-[80px] p-12 md:p-24 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.2),transparent)]" />
             <div className="relative z-10 space-y-8">
                <h2 className="text-5xl md:text-7xl font-black leading-tight">Your biology, <br/>upgraded.</h2>
                <p className="text-xl text-emerald-50 font-medium max-w-2xl mx-auto">The journey to a longer, high-performance life starts with one online assessment.</p>
                <Link to="/patient/shop" className="inline-block">
                  <Button className="h-16 px-12 rounded-3xl bg-white text-emerald-600 font-black uppercase text-sm tracking-widest shadow-2xl shadow-black/20 hover:scale-105 transition-transform">
                    Start Your Assessment
                  </Button>
                </Link>
             </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
