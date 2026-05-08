import { motion } from "framer-motion";
import { 
  CheckCircle2, ArrowRight, ShieldCheck, Zap, 
  Activity, Star, Clock, Heart, FlaskConical, 
  Lock, Flame, ThumbsUp, Sparkles
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../../components/ui/shared.tsx";
import { Reveal } from "../../components/ui/Reveal";

export function SexualWellnessPage() {
  return (
    <div className="bg-white text-[#0A0D14] overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-[#FAFAFF]">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.05),transparent)] -z-10" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Reveal direction="right">
              <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                🔒 Discreet · 100% Online · FDA-Approved
              </Badge>
            </Reveal>
            <Reveal direction="right" delay={0.3}>
              <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tight text-[#0A0D14]">
                Reclaim your <span className="text-blue-600">confidence.</span> Reconnect fully.
              </h1>
            </Reveal>
            <Reveal direction="right" delay={0.4}>
              <p className="text-xl text-slate-500 font-medium max-w-xl">
                Science-backed solutions for ED and PE. Prescribed online by U.S. licensed doctors and delivered in discreet packaging to your door.
              </p>
            </Reveal>
            <Reveal direction="right" delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/patient/shop">
                  <Button className="h-16 px-10 rounded-2xl bg-[#0A0D14] text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-blue-900/20 group">
                    Get Started Now <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3 px-4">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Secure & Discreet<br/>Plain Packaging</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal direction="left" delay={0.4}>
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/5 rounded-[40px] blur-3xl" />
              <img 
                src="https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&w=800&q=80" 
                alt="Confident Professional" 
                className="relative rounded-[40px] shadow-2xl z-10 w-full object-cover aspect-[4/5]"
              />
              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 bottom-12 bg-white p-6 rounded-3xl shadow-2xl z-20 border border-slate-100 max-w-[220px]"
              >
                <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-xl font-black text-[#0A0D14]">94% Success</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate for PDE5-Inhibitor Treatments</p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. TREATMENT OPTIONS COMPARISON */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black">The Right Solution for You.</h2>
              <p className="text-slate-500 font-medium">Generic options for high performance without the high cost.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { 
                name: "Sildenafil (Generic Viagra)", 
                use: "On-Demand Performance",
                time: "30-60 mins before",
                duration: "4-6 hours",
                ideal: "Spontaneous activity",
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              { 
                name: "Tadalafil (Generic Cialis)", 
                use: "Daily Readiness",
                time: "Taken daily",
                duration: "Up to 36 hours",
                ideal: "Daily spontaneity",
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              }
            ].map((t, i) => (
              <Reveal key={i} direction="up" delay={0.2 * i}>
                <Card className="border-2 border-slate-100 p-8 rounded-[48px] h-full hover:border-blue-500 transition-all group overflow-hidden relative">
                  <div className={cn("absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-10", t.bg)} />
                  <CardContent className="p-0 space-y-6">
                    <h3 className="text-2xl font-black">{t.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Best For</p>
                          <p className="font-bold text-sm">{t.use}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing</p>
                          <p className="font-bold text-sm">{t.time}</p>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 space-y-4">
                       <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <p className="text-sm font-medium"><span className="font-black">Duration:</span> {t.duration}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <ThumbsUp className="h-4 w-4 text-emerald-500" />
                          <p className="text-sm font-medium"><span className="font-black">Ideal For:</span> {t.ideal}</p>
                       </div>
                    </div>
                    <Link to="/patient/shop" className="block pt-4">
                      <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest">
                        Check Eligibility
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CLINICAL DATA SECTION */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
          <Reveal direction="right">
            <div className="space-y-8">
              <h2 className="text-4xl font-black leading-tight">Prescribed by experts. <br/>Backed by <span className="text-blue-600">Clinical Data.</span></h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                We only prescribe FDA-approved medications that have been tested in rigorous clinical trials with thousands of patients.
              </p>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-4xl font-black text-blue-600">82%</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-snug">Reported improved erections in clinical trials</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl font-black text-emerald-600">30m</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-snug">Average time for medication to take effect</p>
                </div>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                   <ShieldCheck className="h-5 w-5" />
                   <p className="font-black text-xs uppercase tracking-widest">Safety First</p>
                </div>
                <p className="text-sm text-slate-500 font-medium">All prescriptions are reviewed for potential contraindications with existing medications or heart conditions.</p>
              </div>
            </div>
          </Reveal>

          <Reveal direction="left">
             <div className="relative p-12 bg-white rounded-[64px] shadow-2xl border border-slate-100">
                <div className="space-y-8">
                   <div className="flex justify-between items-center">
                      <h4 className="font-black text-xl">Treatment Protocol</h4>
                      <Badge className="bg-blue-50 text-blue-600">Standard Dose</Badge>
                   </div>
                   
                   <div className="space-y-6">
                      {[
                        { title: "Consultation", desc: "Share your history and blood pressure with our doctor." },
                        { title: "Personalized RX", desc: "A custom plan tailored to your lifestyle and goals." },
                        { title: "Discreet Delivery", desc: "Unmarked boxes for total privacy and convenience." }
                      ].map((step, i) => (
                        <div key={i} className="flex gap-4">
                           <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">{i+1}</div>
                           <div>
                              <p className="font-black text-[#0A0D14] text-sm">{step.title}</p>
                              <p className="text-xs text-slate-400 font-medium">{step.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="pt-6 border-t border-slate-50">
                      <div className="flex items-center justify-between mb-4">
                         <p className="text-xs font-black uppercase tracking-widest text-slate-400">Monthly Cost</p>
                         <p className="text-2xl font-black text-blue-600">From $2 / dose</p>
                      </div>
                      <Button className="w-full h-12 rounded-xl bg-[#0A0D14] text-white font-black uppercase text-[10px] tracking-widest">Start Free Consultation</Button>
                   </div>
                </div>
             </div>
          </Reveal>
        </div>
      </section>

      {/* 4. PREMATURE EJACULATION SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
          <Reveal>
            <div className="space-y-4">
              <h2 className="text-4xl font-black">Take Control. Last Longer.</h2>
              <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                Premature Ejaculation (PE) is the most common sexual health concern for men. We offer proven treatments to help you stay in the moment.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sertraline", type: "Oral Pill", effect: "Delay climax by 200%+" },
              { name: "Paroxetine", type: "Oral Pill", effect: "Consistent control" },
              { name: "Delay Spray", type: "Topical", effect: "Instant local reduction" }
            ].map((s, i) => (
              <Reveal key={i} delay={0.1 * i} direction="up">
                 <div className="p-8 rounded-[40px] bg-[#FAFAFF] border border-blue-100 hover:scale-105 transition-transform duration-500">
                    <Flame className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                    <h4 className="font-black text-lg mb-1">{s.name}</h4>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">{s.type}</p>
                    <p className="text-sm font-bold text-slate-500">{s.effect}</p>
                 </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-24 bg-white px-6">
        <Reveal>
          <div className="max-w-5xl mx-auto bg-blue-600 rounded-[64px] p-12 md:p-24 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.2),transparent)]" />
             <div className="relative z-10 space-y-8">
                <h2 className="text-5xl md:text-6xl font-black leading-tight">Real care for <br/>real performance.</h2>
                <p className="text-xl text-blue-50 font-medium max-w-2xl mx-auto">Get your assessment today. 100% online, 100% confidential, 100% professional.</p>
                <Link to="/patient/shop" className="inline-block">
                  <Button className="h-16 px-12 rounded-2xl bg-white text-blue-600 font-black uppercase text-sm tracking-widest shadow-2xl shadow-black/20 hover:scale-105 transition-transform">
                    Start My Consultation
                  </Button>
                </Link>
             </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
