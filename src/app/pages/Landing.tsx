import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Zap, Activity,
  Menu, X, Star, ChevronDown,
  Pill, Heart, Sparkles, Layout, Lock
} from "lucide-react";
import { Button, Card, CardContent, cn } from "../components/ui/shared.tsx";
import { Reveal } from "../components/ui/Reveal";
import { PatientShopPage } from "./patient/pages/Shop";

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
    color: "text-amber-600",
    bg: "bg-amber-50"
  }
];

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showTreatments, setShowTreatments] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (shopOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [shopOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-sans text-[#0A0D14] selection:bg-emerald-100 selection:text-emerald-900">

      {/* ===== FULL-SCREEN SHOP MODAL ===== */}
      {shopOpen && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
            <img src="/originallogo.png" alt="Peak Health" className="h-10 object-contain" />
            <button
              onClick={() => setShopOpen(false)}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors px-4 py-2 rounded-full border border-slate-200 hover:border-slate-400"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
          <div className="max-w-4xl mx-auto px-4 py-8">
            <PatientShopPage />
          </div>
        </div>
      )}

      {/* 1. Announcement Ticker */}
      <div className="bg-[#0A0D14] text-white py-2 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee-fast flex gap-12 items-center text-[10px] font-black uppercase tracking-[0.2em]">
          {[1, 2, 3].map(i => (
            <span key={i} className="flex items-center gap-12">
              <span className="mx-6">⚕️ 50-State Provider Network</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
              <span className="mx-6">🔒 HIPAA SECURE PLATFORM</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
              <span className="mx-6">📦 Free Expedited Delivery</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. Professional Header */}
      <header className={cn("sticky top-0 z-50 transition-all duration-500", 
        scrolled ? "bg-white/90 backdrop-blur-xl border-b border-slate-100 py-3 shadow-md" : "bg-transparent py-6")}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/originallogo.png" alt="Peak Health" className="h-28 md:h-32 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <div className="relative" onMouseEnter={() => setShowTreatments(true)} onMouseLeave={() => setShowTreatments(false)}>
                <button className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest text-slate-600 hover:text-[#0A0D14] transition-colors py-2">
                  Treatments <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showTreatments && "rotate-180")} />
                </button>
                
                {/* Mega Menu Dropdown */}
                {showTreatments && (
                  <div className="absolute top-full -left-4 w-[480px] pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 p-4 grid grid-cols-1 gap-2">
                      {treatments.map((t) => (
                        <Link key={t.name} to={t.href} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", t.bg)}>
                            <t.icon className={cn("h-6 w-6", t.color)} />
                          </div>
                          <div>
                            <p className="font-black text-sm text-[#0A0D14]">{t.name}</p>
                            <p className="text-xs text-slate-400 font-bold">{t.desc}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 ml-auto text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {["How It Works", "Medical Team", "Reviews"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                  className="text-[12px] font-black uppercase tracking-widest text-slate-600 hover:text-[#0A0D14] transition-colors">
                  {item}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/patient/login" className="hidden sm:block text-[12px] font-black uppercase tracking-widest text-slate-600 hover:text-[#0A0D14]">
              Sign In
            </Link>
            <button onClick={() => setShopOpen(true)}>
              <Button className="rounded-full bg-[#0A0D14] text-white hover:bg-[#1A1D24] px-8 py-6 font-black text-xs tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                GET STARTED
              </Button>
            </button>
            <button className="lg:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (with Scroll Reveal) */}
      <section className="relative overflow-x-clip pt-12 pb-24 md:pt-20 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-[55%] space-y-8 z-10 text-center lg:text-left">
            <Reveal direction="up">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Now Prescribing in 50 States
              </div>
            </Reveal>

            <Reveal direction="right" delay={0.3}>
              <h1 className="text-6xl md:text-[90px] font-black text-[#0A0D14] leading-[0.9] tracking-tight">
                Clinical<br/>
                results for<br/>
                <span className="text-emerald-600 font-serif italic font-medium tracking-normal">your biology.</span>
              </h1>
            </Reveal>

            <Reveal direction="up" delay={0.4}>
              <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
                U.S. licensed providers, pharmaceutical-grade treatments, and 24/7 care. Your health journey, reimagined for the modern world.
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.5}>
              <div className="flex flex-col sm:flex-row gap-5 pt-4 justify-center lg:justify-start">
                <button onClick={() => setShopOpen(true)}>
                  <Button className="h-16 px-10 rounded-2xl bg-[#0A0D14] text-white hover:bg-[#1A1D24] font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-900/30 group">
                    View All Treatments <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </button>
                <Link to="/patient/login">
                  <Button variant="outline" className="h-16 px-10 rounded-2xl border-2 border-slate-100 font-black uppercase text-xs tracking-widest hover:bg-slate-50">
                    Patient Login
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.4}>
            <div className="lg:w-[45%] relative">
               <div className="absolute -inset-10 bg-emerald-500/10 rounded-[64px] blur-3xl animate-pulse" />
               <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80" 
                alt="Patient Results" 
                className="relative rounded-[64px] shadow-2xl z-10 w-full h-[600px] object-cover animate-bounce-slow"
              />
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 top-20 bg-white p-6 rounded-3xl shadow-2xl z-20 border border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-600">-15.3%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Body Weight Loss</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. Treatments Grid — opens the full shop modal */}
      <section id="treatments" className="py-32 bg-[#F8FAF9]">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight">Our Specialty Programs</h2>
              <p className="text-lg text-slate-500 font-medium">Clinically backed treatments for your most important health goals.</p>
              <button onClick={() => setShopOpen(true)} className="inline-flex items-center gap-2 mt-4 text-emerald-600 font-black text-sm uppercase tracking-widest hover:gap-3 transition-all">
                View All 12 Treatments <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {treatments.map((t, i) => (
              <Reveal key={t.name} delay={0.2 * i} direction="up">
                <Card
                  className="border-none bg-white rounded-[48px] overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer"
                  onClick={() => setShopOpen(true)}
                >
                  <CardContent className="p-0">
                    <div className={cn("h-48 flex items-center justify-center group-hover:scale-105 transition-transform duration-700", t.bg)}>
                      <t.icon className={cn("h-20 w-20 opacity-20", t.color)} />
                    </div>
                    <div className="p-10 space-y-6">
                      <h3 className="text-3xl font-black">{t.name}</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">{t.desc}</p>
                      <Button className="w-full h-14 rounded-2xl bg-[#0A0D14] text-white font-black uppercase text-[10px] tracking-widest group-hover:bg-emerald-600 transition-all">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works (The "Deep" Experience) */}
      <section id="how-it-works" className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <Reveal direction="up">
                <h2 className="text-5xl md:text-6xl font-black leading-tight">Healthcare that <span className="text-emerald-600">moves</span> with you.</h2>
              </Reveal>
              
              <div className="space-y-8">
                {[
                  { icon: Layout, title: "Online Intake", desc: "A few minutes to share your goals and history." },
                  { icon: ShieldCheck, title: "Provider Review", desc: "A U.S. licensed clinician creates your custom protocol." },
                  { icon: Zap, title: "Discreet Delivery", desc: "Medication arrives at your door in plain packaging." }
                ].map((item, i) => (
                  <Reveal key={i} direction="up" delay={0.2 * i}>
                    <div className="flex gap-6">
                      <div className="h-16 w-16 rounded-[24px] bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                        <item.icon className="h-8 w-8" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black">{item.title}</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal direction="up">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-[80px] rotate-6 scale-95" />
                <div className="relative bg-[#0A0D14] rounded-[80px] p-12 text-white shadow-2xl h-[600px] flex flex-col justify-center overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px]" />
                  <div className="space-y-8 relative z-10">
                    <Lock className="h-12 w-12 text-emerald-400" />
                    <h3 className="text-4xl font-black">HIPAA Secure.<br/>Patient Obsessed.</h3>
                    <p className="text-xl text-slate-400 font-medium">Your data is encrypted, your privacy is protected, and your health is our only mission.</p>
                    <div className="flex items-center gap-4 pt-8">
                      <div className="h-12 w-32 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                        <span className="text-[10px] font-black tracking-widest uppercase">SSL SECURE</span>
                      </div>
                      <div className="h-12 w-32 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                        <span className="text-[10px] font-black tracking-widest uppercase">LEGITSCRIPT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. Ultimate Global Footer (Elite Tier) */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-12 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-24">
            {/* Column 1: Brand & Badges */}
            <div className="lg:col-span-1 space-y-10">
              <img src="/originallogo.png" alt="Peak Health" className="h-14 object-contain" />
              <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                Empowering individuals through clinical rigor and personalized wellness protocols. The future of healthcare is biological.
              </p>
              
              {/* Certification Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                  <img src="https://www.legitscript.com/wp-content/themes/legitscript/assets/images/seal-healthcare.png" alt="LegitScript" className="h-full object-contain grayscale opacity-60" />
                </div>
                <div className="h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 text-[8px] font-black text-center leading-tight opacity-40 uppercase">
                  Made in USA
                </div>
                <div className="h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 opacity-40">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-5">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className="h-4 w-4 bg-slate-200 rounded-sm hover:bg-emerald-500 transition-colors cursor-pointer" />
                ))}
                <div className="flex items-center gap-1.5 text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] ml-2">
                   <Star className="h-3 w-3 fill-slate-400" /> Trustpilot
                </div>
              </div>
            </div>

            {/* Column 2: Treatments */}
            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Treatments</h4>
              <ul className="space-y-6">
                {[
                  { name: "Tirzepatide+", sub: "Weight Loss", href: "/treatments/weight-loss" },
                  { name: "Semaglutide+", sub: "Weight Loss", href: "/treatments/weight-loss" },
                  { name: "NAD+ Therapy", sub: "Longevity", href: "/treatments/longevity" },
                  { name: "Hair Regrowth", sub: "Clinical Hair", href: "/treatments/hair-loss" },
                  { name: "ED Treatments", sub: "Sexual Wellness", href: "/treatments/sexual-wellness" }
                ].map(item => (
                  <li key={item.name}>
                    <Link to={item.href} className="group block">
                      <p className="text-[15px] font-black text-[#0A0D14] group-hover:text-emerald-600 transition-colors leading-tight">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.sub}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Platform */}
            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Platform</h4>
              <ul className="space-y-5">
                {[
                  { name: "How It Works", href: "/#how-it-works" },
                  { name: "Medical Team", href: "/#medical-team" },
                  { name: "Clinical FAQ", href: "/support-hub" },
                  { name: "The Bio-Blog", href: "/blog" },
                ].map(item => (
                  <li key={item.name}>
                    <Link to={item.href} className="text-[15px] font-black text-[#0A0D14] hover:text-emerald-600 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Authority */}
            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Authority</h4>
              <ul className="space-y-5">
                {[
                  { name: "Clinical Research", href: "/clinical-research" },
                  { name: "Safety Info", href: "/support-hub" },
                  { name: "Patient Rights", href: "/support-hub" },
                  { name: "HIPAA Privacy", href: "/support-hub" },
                  { name: "Pharmacy Network", href: "/support-hub" },
                  { name: "Code of Conduct", href: "/support-hub" }
                ].map(item => (
                  <li key={item.name}>
                    <Link to={item.href} className="text-[15px] font-black text-[#0A0D14] hover:text-emerald-600 transition-colors leading-tight">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 5: Support */}
            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Support</h4>
              <ul className="space-y-5">
                {[
                  { name: "Contact Support", href: "/support-hub" },
                  { name: "Referral Program", href: "/patient/referrals" },
                  { name: "Affiliate Portal", href: "/support-hub" },
                  { name: "Careers", href: "/support-hub" },
                  { name: "Partnerships", href: "/support-hub" }
                ].map(item => (
                  <li key={item.name}>
                    <Link to={item.href} className="text-[15px] font-black text-[#0A0D14] hover:text-emerald-600 transition-colors leading-tight">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 6: Staff & Admin */}
            <div className="space-y-8 lg:border-l lg:border-slate-100 lg:pl-12">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Secure Portals</h4>
                <div className="h-0.5 w-6 bg-emerald-500/20 rounded-full" />
              </div>
              <ul className="space-y-3">
                {[
                  { name: "Patient Login", href: "/patient/login", primary: true },
                  { name: "Provider Portal", href: "/doctor/login", primary: false },
                  { name: "Admin Access", href: "/admin/login", primary: false },
                  { name: "SuperAdmin", href: "/superadmin/login", primary: false },
                  { name: "Pharmacy Hub", href: "/pharmacy/login", primary: false }
                ].map(item => (
                  <li key={item.name}>
                    <Link 
                      to={item.href} 
                      className={cn(
                        "text-[11px] font-black uppercase tracking-widest transition-all px-5 py-3 rounded-2xl inline-flex items-center gap-2 border w-full justify-center lg:justify-start",
                        item.primary 
                          ? "bg-[#0A0D14] text-white border-[#0A0D14] shadow-xl shadow-slate-900/10 hover:bg-emerald-600 hover:border-emerald-600 hover:shadow-emerald-500/20" 
                          : "bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                      )}
                    >
                      {item.name}
                      {!item.primary && <ArrowRight className="h-3 w-3 opacity-30" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar with Stylized Signature */}
          <div className="pt-12 border-t border-slate-100 flex flex-col lg:flex-row justify-between items-end gap-12">
            <div className="space-y-6 max-w-3xl">
               <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                 © {new Date().getFullYear()} Peak Health Technology Group, Inc. All rights reserved.
               </p>
               <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                 *DISCLAIMER: The information provided on this site is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Prescriptions are provided at the sole discretion of the treating provider.
               </p>
            </div>
            <div className="text-right shrink-0">
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[#0A0D14] leading-none">
                 it's about <span className="text-emerald-500 font-serif italic font-medium">you.</span>
               </h2>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
