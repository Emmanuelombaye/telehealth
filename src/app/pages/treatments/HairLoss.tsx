import { motion } from "framer-motion";
import { 
  CheckCircle2, ArrowRight, ShieldCheck, Zap, 
  Activity, Star, Clock, Heart, FlaskConical, 
  Sparkles, TrendingUp, RefreshCw, Layers
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../../components/ui/shared";
import { Reveal } from "../../components/ui/Reveal";

export function HairLossPage() {
  return (
    <div className="bg-white text-[#0A0D14] overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-[#FFF9F5]">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(249,115,22,0.05),transparent)] -z-10" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Reveal direction="right">
              <Badge className="bg-orange-50 text-orange-700 border-orange-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                🛡️ Clinically Proven Regrowth Protocols
              </Badge>
            </Reveal>
            <Reveal direction="right" delay={0.3}>
              <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tight">
                Keep your hair. <br/>Keep your <span className="text-orange-600">confidence.</span>
              </h1>
            </Reveal>
            <Reveal direction="right" delay={0.4}>
              <p className="text-xl text-slate-500 font-medium max-w-xl">
                The earlier you start, the more you keep. Our medical protocols stop thinning and stimulate regrowth using FDA-approved ingredients.
              </p>
            </Reveal>
            <Reveal direction="right" delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/patient/shop">
                  <Button className="h-16 px-10 rounded-2xl bg-[#0A0D14] text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-orange-900/20 group">
                    Start Hair Assessment <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3 px-4">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">4.8/5 Rating<br/>from 15,000+ Men</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal direction="left" delay={0.4}>
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-500/5 rounded-[40px] blur-3xl" />
              <img 
                src="https://images.unsplash.com/photo-1503910321662-f019567c8cb2?auto=format&fit=crop&w=800&q=80" 
                alt="Man with healthy hair" 
                className="relative rounded-[40px] shadow-2xl z-10 w-full object-cover aspect-[4/5]"
              />
              <motion.div 
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 bottom-12 bg-white p-6 rounded-3xl shadow-2xl z-20 border border-slate-100 max-w-[220px]"
              >
                <div className="h-10 w-10 rounded-2xl bg-orange-500 flex items-center justify-center mb-4 text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p className="text-xl font-black text-[#0A0D14]">90% Success</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In stopping further loss and stimulating regrowth</p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. THE GROWTH TIMELINE (ANIMATED) */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-black">The Regrowth Timeline.</h2>
              <p className="text-slate-500 font-medium">Hair growth takes time. Here's what to expect.</p>
            </div>
          </Reveal>

          <div className="relative">
             <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2" />
             <div className="grid lg:grid-cols-3 gap-12">
                {[
                  { 
                    month: "Month 1-3", 
                    title: "The Reset", 
                    desc: "Old, weak hairs shed to make room for new, stronger growth. Your follicles are being reactivated.",
                    icon: RefreshCw
                  },
                  { 
                    month: "Month 3-6", 
                    title: "Early Results", 
                    desc: "Shedding slows down significantly. You'll start to see 'peach fuzz' and increased density.",
                    icon: Zap
                  },
                  { 
                    month: "Month 6-12", 
                    title: "Peak Density", 
                    desc: "Noticeable regrowth. Hair is thicker, darker, and the hairline begins to fill in properly.",
                    icon: Sparkles
                  }
                ].map((s, i) => (
                  <Reveal key={i} delay={0.2 * i} direction="up">
                     <div className="bg-white p-10 rounded-[48px] border-2 border-slate-50 relative z-10 h-full hover:border-orange-200 transition-colors group">
                        <div className="h-16 w-16 rounded-[24px] bg-orange-50 text-orange-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                           <s.icon className="h-8 w-8" />
                        </div>
                        <p className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] mb-4">{s.month}</p>
                        <h4 className="text-2xl font-black mb-4">{s.title}</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                     </div>
                  </Reveal>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* 3. TREATMENT OPTIONS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
          <Reveal direction="right">
             <div className="space-y-8">
                <h2 className="text-4xl font-black leading-tight">Scientifically proven <br/>to <span className="text-orange-600">stop hair loss.</span></h2>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                         <Layers className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                         <h4 className="font-black text-lg">Finasteride (Oral/Topical)</h4>
                         <p className="text-sm text-slate-500 font-medium leading-relaxed">Blocks DHT, the hormone responsible for male pattern baldness. Addresses the root cause.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                         <Activity className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                         <h4 className="font-black text-lg">Minoxidil (Topical)</h4>
                         <p className="text-sm text-slate-500 font-medium leading-relaxed">Increases blood flow to the follicles, providing the nutrients needed for growth.</p>
                      </div>
                   </div>
                </div>
                <div className="p-8 bg-white rounded-[40px] border border-slate-200">
                   <p className="font-bold text-sm mb-4">"The 2-in-1 Power Combo"</p>
                   <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">Studies show that using both Finasteride and Minoxidil together is significantly more effective than using either alone.</p>
                   <Link to="/patient/shop">
                      <Button className="w-full h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-500/20">View Power Combo Options</Button>
                   </Link>
                </div>
             </div>
          </Reveal>

          <Reveal direction="left">
             <div className="relative">
                <div className="absolute inset-0 bg-orange-500/10 rounded-[64px] rotate-3" />
                <div className="relative bg-white p-12 rounded-[64px] shadow-2xl border border-slate-100 text-center space-y-8">
                   <h3 className="text-3xl font-black">The Peak Results</h3>
                   <div className="space-y-4">
                      {[
                        { label: "DHT Reduction", val: "70%" },
                        { label: "Visible Regrowth", val: "88%" },
                        { label: "Patient Satisfaction", val: "94%" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                           <p className="text-sm font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                           <p className="text-2xl font-black text-orange-600">{item.val}</p>
                        </div>
                      ))}
                   </div>
                   <div className="pt-8 grid grid-cols-2 gap-4">
                      <div className="h-32 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Before</p>
                         <div className="h-2 w-16 bg-slate-200 rounded-full mt-2" />
                      </div>
                      <div className="h-32 bg-orange-50 rounded-3xl border border-dashed border-orange-200 flex flex-col items-center justify-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-orange-300">After 6mo</p>
                         <div className="h-4 w-20 bg-orange-300 rounded-full mt-2" />
                      </div>
                   </div>
                </div>
             </div>
          </Reveal>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="py-24 bg-white px-6">
        <Reveal>
          <div className="max-w-5xl mx-auto bg-orange-600 rounded-[64px] p-12 md:p-24 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.2),transparent)]" />
             <div className="relative z-10 space-y-8">
                <h2 className="text-5xl md:text-6xl font-black leading-tight">Don't wait until <br/>it's too late.</h2>
                <p className="text-xl text-orange-50 font-medium max-w-2xl mx-auto">The best time to start was yesterday. The second best time is today. Get your assessment in 5 minutes.</p>
                <Link to="/patient/shop" className="inline-block">
                  <Button className="h-16 px-12 rounded-2xl bg-white text-orange-600 font-black uppercase text-sm tracking-widest shadow-2xl shadow-black/20 hover:scale-105 transition-transform">
                    Start My Assessment
                  </Button>
                </Link>
             </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
