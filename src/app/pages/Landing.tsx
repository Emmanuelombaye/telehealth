import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, Zap, 
  Activity, Sparkles, Pill, Heart, 
  Layout, Lock, Star 
} from "lucide-react";
import { Button, Card, CardContent, cn } from "../components/ui/shared.tsx";
import { Reveal } from "../components/ui/Reveal";

const treatments = [
  { 
    name: "Weight Loss", 
    href: "/treatments/weight-loss", 
    desc: "GLP-1 medications for sustainable results.",
    icon: Activity,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  { 
    name: "Sexual Wellness", 
    href: "/treatments/sexual-wellness", 
    desc: "ED and PE treatments that actually work.",
    icon: Heart,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  { 
    name: "Hair Loss", 
    href: "/treatments/hair-loss", 
    desc: "Clinically proven hair regrowth protocols.",
    icon: Pill,
    color: "text-orange-600",
    bg: "bg-orange-50"
  }
];

const results = [
  { name: "Lisa C.", lost: "75lbs", time: "10 Months", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80" },
  { name: "Blaze B.", lost: "50lbs", time: "6 Months", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80" },
  { name: "Crystal G.", lost: "50lbs", time: "6 Months", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80" }
];

export function LandingPage() {
  const [resultIdx, setResultIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setResultIdx(prev => (prev + 1) % results.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 px-6 bg-gradient-to-br from-[#0A0D14] to-[#111814] text-white overflow-hidden">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
         
         <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="lg:w-[55%] space-y-8 text-center lg:text-left">
            <Reveal direction="up">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
                designed around you.
              </div>
            </Reveal>

            <Reveal direction="right" delay={0.3}>
              <h1 className="text-6xl md:text-[80px] font-black leading-[0.9] tracking-tighter">
                Clinical results<br/>
                for <span className="text-emerald-500 font-serif italic font-medium tracking-normal">your biology.</span>
              </h1>
            </Reveal>

            <Reveal direction="up" delay={0.4}>
              <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed font-medium">
                U.S. licensed providers, pharmaceutical-grade treatments, and 24/7 care. Your health journey, reimagined for the modern world.
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-5 pt-4 justify-center lg:justify-start">
                <Link to="/explore-treatments">
                  <Button className="h-16 px-10 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-500/30 group border-none">
                    View All Treatments <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/patient/login">
                  <Button variant="outline" className="h-16 px-10 rounded-2xl border-2 border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/5">
                    Patient Login
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.4}>
            <div className="lg:w-[45%] relative">
               <div className="absolute -inset-10 bg-emerald-500/10 rounded-[64px] blur-3xl" />
               <img 
                src={results[resultIdx].img} 
                alt="Patient Results" 
                className="relative rounded-[64px] shadow-2xl z-10 w-full h-[550px] object-cover transition-all duration-1000"
              />
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 top-20 bg-white p-6 rounded-[32px] shadow-2xl z-20 border border-slate-100 text-[#0A0D14]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-600">-{results[resultIdx].lost}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lost in {results[resultIdx].time}</p>
                    <p className="text-[10px] font-bold text-slate-900">{results[resultIdx].name} • Verified Patient</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Treatments Section */}
      <section className="py-32 bg-[#F8FAF9]">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-5xl font-black tracking-tight">Our Specialty Programs</h2>
              <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">Find your custom health plan by selecting a goal below.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {treatments.map((t, i) => (
              <Reveal key={t.name} delay={0.2 * i} direction="up">
                <Card
                  className="border-none bg-white rounded-[48px] overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer"
                  onClick={() => {}}
                >
                  <CardContent className="p-0">
                    <div className={cn("h-48 flex items-center justify-center group-hover:scale-105 transition-transform duration-700", t.bg)}>
                      <t.icon className={cn("h-20 w-20 opacity-20", t.color)} />
                    </div>
                    <div className="p-10 space-y-6">
                      <h3 className="text-3xl font-black">{t.name}</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">{t.desc}</p>
                      <Link to={t.href}>
                        <Button className="w-full h-14 rounded-2xl bg-[#0A0D14] text-white font-black uppercase text-[10px] tracking-widest group-hover:bg-emerald-600 transition-all border-none">
                          Learn More <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-white overflow-hidden" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-20">
          <Reveal>
            <div className="space-y-4">
               <h2 className="text-5xl font-black leading-tight">Healthcare that <span className="text-emerald-600">moves</span> with you.</h2>
               <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">From onboarding through treatment, we'll be supporting and guiding you every step of the way.</p>
            </div>
          </Reveal>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
             <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-slate-100 -z-10" />
             {[
               { title: "Choose a plan & checkout", icon: Layout, desc: "Complete a short questionnaire to confirm eligibility." },
               { title: "Provider review", icon: ShieldCheck, desc: "A U.S. licensed provider reviews your intake within 24h." },
               { title: "Start treatment", icon: Zap, desc: "Prescription filled and delivered with 2-day shipping." }
             ].map((item, i) => (
               <Reveal key={i} direction="up" delay={0.2 * i}>
                 <div className="space-y-6">
                   <div className="h-24 w-24 rounded-[32px] bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                     <item.icon className="h-10 w-10" />
                   </div>
                   <h4 className="text-xl font-black">{item.title}</h4>
                   <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                 </div>
               </Reveal>
             ))}
          </div>

          <Reveal>
             <Link to="/how-it-works">
               <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-100 font-black uppercase text-xs tracking-widest hover:bg-slate-50">
                 Detailed Patient Experience
               </Button>
             </Link>
          </Reveal>
        </div>
      </section>

      {/* Science & Trust */}
      <section className="py-32 bg-[#F8FAF9] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <Reveal direction="right">
                <div className="space-y-8">
                   <h2 className="text-5xl font-black leading-tight">Trusted by experts.<br/>Backed by science.</h2>
                   <p className="text-xl text-slate-500 font-medium leading-relaxed">
                      All treatments are prescribed by U.S. licensed providers and filled by high-quality compounding pharmacies that adhere to strict safety standards.
                   </p>
                   <div className="flex flex-wrap gap-12 pt-8 grayscale opacity-30">
                      <img src="https://www.legitscript.com/wp-content/themes/legitscript/assets/images/seal-healthcare.png" alt="LegitScript" className="h-16" />
                      <div className="flex items-center gap-2">
                         <ShieldCheck className="h-10 w-10" />
                         <span className="font-black text-xl tracking-tighter">HIPAA SECURE</span>
                      </div>
                   </div>
                </div>
             </Reveal>
             <Reveal direction="left">
                <div className="grid grid-cols-2 gap-4">
                   {[
                     { label: "Providers", val: "50+", sub: "Across 50 states" },
                     { label: "Success Rate", val: "94%", sub: "Patient satisfaction" },
                     { label: "Processing", val: "24h", sub: "Clinical review" },
                     { label: "Shipping", val: "2-Day", sub: "Expedited delivery" }
                   ].map((stat, i) => (
                     <Card key={i} className="bg-white border-none rounded-[32px] p-8 shadow-xl shadow-slate-200/50">
                        <p className="text-4xl font-black text-emerald-600 mb-1">{stat.val}</p>
                        <p className="text-xs font-black uppercase tracking-widest text-[#0A0D14] mb-1">{stat.label}</p>
                        <p className="text-[10px] font-bold text-slate-400">{stat.sub}</p>
                     </Card>
                   ))}
                </div>
             </Reveal>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 bg-white text-center px-6">
        <Reveal>
          <div className="max-w-5xl mx-auto bg-[#0A0D14] rounded-[64px] p-12 md:p-24 text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.1),transparent)]" />
             <div className="relative z-10 space-y-10">
                <h2 className="text-5xl md:text-7xl font-black leading-tight">Start your <br/>transformation.</h2>
                <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">Join thousands of patients who have reclaimed their health and confidence with Peak Health.</p>
                <Link to="/patient/shop" className="inline-block">
                  <Button className="h-20 px-16 rounded-[24px] bg-emerald-600 text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-transform">
                    Check Eligibility Now
                  </Button>
                </Link>
             </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
