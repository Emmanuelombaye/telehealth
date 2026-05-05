import { motion } from "framer-motion";
import { 
  CheckCircle2, ArrowRight, ShieldCheck, Zap, 
  Activity, Star, Clock, Heart, FlaskConical, AlertCircle
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../../components/ui/shared";
import { Reveal } from "../../components/ui/Reveal";

export function WeightLossPage() {
  return (
    <div className="bg-white text-[#0A0D14] overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F8FAF9] -z-10 rounded-bl-[200px]" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Reveal direction="right">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                ✨ FDA-Approved GLP-1 Treatments
              </Badge>
            </Reveal>
            <Reveal direction="right" delay={0.3}>
              <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tight">
                Modern science for <span className="text-emerald-600">sustainable</span> weight loss.
              </h1>
            </Reveal>
            <Reveal direction="right" delay={0.4}>
              <p className="text-xl text-slate-500 font-medium max-w-xl">
                Ditch the willpower battle. Our physician-prescribed GLP-1 program targets the biology of weight—helping you lose up to 15% of your body weight safely.
              </p>
            </Reveal>
            <Reveal direction="right" delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/patient/shop">
                  <Button className="h-16 px-10 rounded-2xl bg-[#0A0D14] text-white font-black uppercase text-sm tracking-widest shadow-2xl shadow-slate-900/20 group">
                    Start Your Assessment <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3 px-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4.9/5 from 2,000+ patients</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal direction="left" delay={0.4}>
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/5 rounded-[40px] blur-3xl" />
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80" 
                alt="Happy Patient" 
                className="relative rounded-[40px] shadow-2xl z-10 w-full object-cover aspect-[4/5]"
              />
              {/* Floating Stat Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 bottom-12 bg-white p-6 rounded-3xl shadow-2xl z-20 border border-slate-100 max-w-[200px]"
              >
                <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-black text-emerald-600">-15%</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Body Weight Loss</p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. THE BIOLOGY SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal direction="right">
              <div className="space-y-6">
                <h2 className="text-4xl font-black leading-tight">It's not about willpower. <br/>It's about <span className="text-emerald-600">biology.</span></h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                  Weight is a complex metabolic function, not a character flaw. Our GLP-1 medications (like Semaglutide and Tirzepatide) mimic a natural hormone that:
                </p>
                <div className="space-y-4 pt-4">
                  {[
                    "Regulates blood sugar and insulin levels",
                    "Slows stomach emptying for longer satiety",
                    "Communicates with the brain to reduce cravings",
                    "Reduces the 'food noise' that leads to overeating"
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <p className="font-bold text-slate-700">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            
            <div className="grid grid-cols-2 gap-4">
              <Reveal direction="up" delay={0.3}>
                <Card className="border-none bg-[#F8FAF9] p-4 h-full rounded-[32px]">
                   <CardContent className="p-4 space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <ShieldCheck className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="font-black text-sm uppercase tracking-widest">Safe & Proven</p>
                      <p className="text-xs text-slate-500 font-medium">Physician-monitored titration to ensure minimal side effects.</p>
                   </CardContent>
                </Card>
              </Reveal>
              <Reveal direction="up" delay={0.4}>
                <Card className="border-none bg-[#F8FAF9] p-4 h-full rounded-[32px]">
                   <CardContent className="p-4 space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <Zap className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="font-black text-sm uppercase tracking-widest">Rapid Results</p>
                      <p className="text-xs text-slate-500 font-medium">Patients often see significant results within the first 8–12 weeks.</p>
                   </CardContent>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STEP BY STEP (ANIMATED) */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-black">Your journey to a healthier you.</h2>
              <p className="text-slate-500 font-medium">Simple, fast, and 100% remote.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-slate-200" />
            
            {[
              { 
                step: "01", 
                title: "Online Assessment", 
                desc: "Complete a 5-minute clinical intake covering your medical history and weight-loss goals.",
                icon: FlaskConical 
              },
              { 
                step: "02", 
                title: "Doctor Review", 
                desc: "A licensed physician reviews your data and determines the best treatment protocol for you.",
                icon: Heart 
              },
              { 
                step: "03", 
                title: "Discreet Delivery", 
                desc: "Your medication is compounded and shipped directly from our pharmacy to your door.",
                icon: Zap 
              }
            ].map((s, i) => (
              <Reveal key={i} delay={0.2 * i} direction="up">
                <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-slate-200/50 relative z-10 h-full group hover:-translate-y-2 transition-transform duration-500">
                  <div className="h-16 w-16 rounded-[24px] bg-emerald-500 text-white flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                    <s.icon className="h-8 w-8" />
                  </div>
                  <span className="absolute top-8 right-8 text-4xl font-black text-slate-100 group-hover:text-emerald-50 transition-colors">{s.step}</span>
                  <h3 className="text-xl font-black mb-4">{s.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRICING / PRODUCTS SECTION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-black text-emerald-600">Simple Transparent Pricing.</h2>
              <p className="text-slate-500 font-medium">No hidden fees. No insurance needed. Cancel anytime.</p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-8">
            <Reveal direction="right">
              <Card className="border-2 border-slate-100 p-8 rounded-[48px] h-full hover:border-emerald-500 transition-colors duration-500 group">
                <CardContent className="p-0 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-emerald-50 text-emerald-700 mb-4">BEST FOR BEGINNERS</Badge>
                      <h3 className="text-3xl font-black">Semaglutide</h3>
                    </div>
                    <p className="text-4xl font-black">$199<span className="text-sm text-slate-400">/mo</span></p>
                  </div>
                  <p className="text-slate-500 font-medium">Weekly injections that mimic the GLP-1 hormone. The gold standard for modern medical weight loss.</p>
                  <ul className="space-y-4">
                    {["100% Prescription Included", "Ongoing Clinical Support", "Free Shipping", "Pharmacy Compounding"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-bold text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/patient/shop" className="block">
                    <Button className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                      Get Started with Semaglutide
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal direction="left" delay={0.2}>
               <Card className="border-none bg-[#0A0D14] text-white p-8 rounded-[48px] h-full shadow-2xl">
                <CardContent className="p-0 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-emerald-500 text-white mb-4">HIGHEST EFFICACY</Badge>
                      <h3 className="text-3xl font-black text-white">Tirzepatide</h3>
                    </div>
                    <p className="text-4xl font-black">$329<span className="text-sm text-slate-500">/mo</span></p>
                  </div>
                  <p className="text-slate-400 font-medium">Dual GIP/GLP-1 agonist. Clinical studies show even greater average weight loss results than Semaglutide.</p>
                  <ul className="space-y-4">
                     {["Dual Hormone Action", "Maximum Potency", "Premium Support", "All-Inclusive Pricing"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-bold text-sm text-slate-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/patient/shop" className="block">
                    <Button className="w-full h-14 rounded-2xl bg-white text-[#0A0D14] hover:bg-slate-100 font-black uppercase text-xs tracking-widest transition-all">
                      Get Started with Tirzepatide
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-black">Weight Loss FAQs.</h2>
              <p className="text-slate-500 font-medium">Everything you need to know about the GLP-1 program.</p>
            </div>
          </Reveal>

          <div className="space-y-4">
            {[
              { q: "Is this insurance covered?", a: "We don't accept insurance, which allows us to keep our pricing transparent and competitive without the typical insurance runaround." },
              { q: "How soon will I see results?", a: "Many patients notice a reduction in appetite within days, with significant weight changes starting around week 4–8." },
              { q: "Are there side effects?", a: "Some patients experience nausea or fatigue as their body adjusts. Our doctors manage your dose carefully to minimize this." },
              { q: "Can I cancel my subscription?", a: "Yes, you can cancel at any time through your patient portal. No long-term contracts required." }
            ].map((faq, i) => (
              <Reveal key={i} delay={0.1 * i}>
                <div className="bg-white p-6 rounded-3xl border border-slate-100">
                  <p className="font-black text-lg mb-2">{faq.q}</p>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="py-24 bg-white px-6">
        <Reveal>
          <div className="max-w-5xl mx-auto bg-emerald-600 rounded-[64px] p-12 md:p-24 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.2),transparent)]" />
             <div className="relative z-10 space-y-8">
                <h2 className="text-5xl md:text-6xl font-black leading-tight">Ready to start your <br/>transformation?</h2>
                <p className="text-xl text-emerald-50 font-medium max-w-2xl mx-auto">Join thousands of patients who have reclaimed their health and confidence with Peak Health.</p>
                <Link to="/patient/shop" className="inline-block">
                  <Button className="h-16 px-12 rounded-2xl bg-white text-emerald-600 font-black uppercase text-sm tracking-widest shadow-2xl shadow-black/20 hover:scale-105 transition-transform">
                    Start My Journey Now
                  </Button>
                </Link>
             </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
