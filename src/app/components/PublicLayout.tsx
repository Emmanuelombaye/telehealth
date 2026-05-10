import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  ArrowRight, ChevronDown, X, Menu, ShieldCheck, Lock, Star, 
  Activity, Heart, Pill, Plus, Plane, MapPin, Shield, Flag,
  Instagram, Facebook, Linkedin, ExternalLink, HeartPulse,
  Brain, Zap, Sparkles, Rocket, Microscope, Wind, Layers,
  ChevronUp, ShieldAlert
} from "lucide-react";
import { Button, cn } from "./ui/shared.tsx";
import { PageErrorBoundary } from "./PageErrorBoundary";

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

const bioOptimizers = [
  {
    name: "NAD+ Longevity",
    href: "/bio/nad-plus",
    desc: "Fuel cellular energy and DNA repair.",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    tag: "Most Popular"
  },
  {
    name: "Cognitive Elite",
    href: "/bio/nootropics",
    desc: "Precision neuro-optimization for high performers.",
    icon: Brain,
    color: "text-purple-600",
    bg: "bg-purple-50",
    tag: "Exclusive"
  },
  {
    name: "Regenerative Peptides",
    href: "/bio/peptides",
    desc: "Accelerated tissue repair and recovery.",
    icon: Microscope,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    tag: "New"
  },
  {
    name: "Vitality BHRT",
    href: "/bio/hormones",
    desc: "Optimized hormone replacement protocols.",
    icon: Wind,
    color: "text-blue-600",
    bg: "bg-blue-50",
    tag: "Clinical"
  }
];

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showTreatments, setShowTreatments] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const { pathname } = useLocation();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#0A0D14] selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* GLOBAL SCROLL PROGRESS - Minimalist Line */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-emerald-600 z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* REFINED BACK TO TOP BUTTON - Right end fix */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed right-8 bottom-8 h-14 w-14 rounded-full bg-[#0A2E1F] text-white flex items-center justify-center shadow-2xl hover:bg-emerald-600 transition-all z-50 group border border-emerald-400/20"
          >
             <ChevronUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sticky Header Wrapper */}
      <div className="sticky top-0 z-50">
        {/* Announcement Ticker */}
        <motion.div 
          animate={{ height: scrolled ? 0 : "auto", opacity: scrolled ? 0 : 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="bg-[#0A2E1F] text-emerald-100 overflow-hidden whitespace-nowrap flex"
        >
          <div className="py-2 animate-marquee flex gap-12 items-center text-[11px] font-black uppercase tracking-[0.2em] w-max">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <span key={i} className="flex items-center gap-12">
                <span className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-emerald-400" /> Licensed Providers in all 50 States</span>
                <span className="flex items-center gap-2"><Plane className="h-3 w-3 text-emerald-400" /> Free Expedited Shipment</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-emerald-400" /> U.S. Licensed Pharmacies</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Header */}
        <header className={cn(
          "transition-all duration-500 bg-white/95 backdrop-blur-md border-b border-slate-100", 
          scrolled ? "py-3 shadow-md" : "py-5 shadow-sm"
        )}>
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex-1">
              <Link to="/" className="flex items-center gap-3 group w-fit">
                <img 
                  src="/logo-icon.png" 
                  alt="Peak Health" 
                  className={cn(
                    "w-auto transition-all duration-700 group-hover:scale-105 mix-blend-multiply contrast-125",
                    scrolled ? "h-8 md:h-10" : "h-10 md:h-12"
                  )} 
                />
                <span className={cn(
                  "font-serif italic tracking-tighter text-[#0A2E1F] transition-all duration-700 whitespace-nowrap",
                  scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
                )}>
                  Peak Health
                </span>
              </Link>
            </div>

            {/* Middle: Links */}
            <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-12 flex-1">
              <div className="relative" onMouseEnter={() => setShowTreatments(true)} onMouseLeave={() => setShowTreatments(false)}>
                <Link to="/explore-treatments" className="flex items-center gap-1.5 text-[15px] font-medium text-slate-700 hover:text-[#0A2E1F] transition-all py-2">
                  Treatments <ChevronDown className="h-4 w-4 opacity-50" />
                </Link>
                
                <AnimatePresence>
                  {showTreatments && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full -left-20 w-[480px] pt-4"
                    >
                      <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 p-4 grid grid-cols-1 gap-2">
                        {treatments.map((t) => (
                          <Link key={t.name} to={t.href} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-emerald-50 transition-colors group" onClick={() => setShowTreatments(false)}>
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", t.bg)}>
                              <t.icon className={cn("h-6 w-6", t.color)} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#0A0D14] uppercase tracking-wide">{t.name}</p>
                              <p className="text-xs text-slate-500 font-medium">{t.desc}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/how-it-works" className="text-[15px] font-medium text-slate-700 hover:text-[#0A2E1F] transition-all">
                How It Works
              </Link>
              
              {/* MEGA MENU: BIO-OPTIMIZERS */}
              <div className="relative" onMouseEnter={() => setShowBio(true)} onMouseLeave={() => setShowBio(false)}>
                <div className="flex items-center gap-3 cursor-pointer group py-2">
                   <div className="h-2.5 w-2.5 rounded-full bg-[#D4F0E2] border border-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
                   </div>
                   <span className="text-[15px] font-medium text-slate-700 group-hover:text-[#0A2E1F] transition-colors flex items-center gap-1.5">
                     Bio-Optimizers <ChevronDown className="h-4 w-4 opacity-50" />
                   </span>
                </div>

                <AnimatePresence>
                  {showBio && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full -left-40 w-[560px] pt-4"
                    >
                      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 grid grid-cols-2 gap-6 overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50"></div>
                         
                         <div className="col-span-2 flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Biological Optimization Selection</h4>
                            <Link to="/bio" className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                               View All Bio-Protocols <ArrowRight className="h-3 w-3" />
                            </Link>
                         </div>

                         {bioOptimizers.map((b) => (
                           <Link key={b.name} to={b.href} className="flex flex-col gap-3 p-5 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                              <div className="flex items-center justify-between">
                                 <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", b.bg)}>
                                    <b.icon className={cn("h-5 w-5", b.color)} />
                                 </div>
                                 <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                                    {b.tag}
                                 </span>
                              </div>
                              <div className="space-y-1">
                                 <p className="font-black text-sm text-[#0A0D14] uppercase tracking-wide group-hover:text-emerald-700 transition-colors">{b.name}</p>
                                 <p className="text-[11px] text-slate-400 font-medium leading-relaxed group-hover:text-slate-500 transition-colors">{b.desc}</p>
                              </div>
                           </Link>
                         ))}

                         <div className="col-span-2 mt-4 p-4 bg-emerald-900 rounded-[28px] flex items-center justify-between shadow-xl shadow-emerald-900/10">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 rounded-2xl bg-emerald-400/20 flex items-center justify-center">
                                  <Rocket className="h-5 w-5 text-emerald-400" />
                               </div>
                               <div>
                                  <p className="text-white text-xs font-black uppercase tracking-widest">Master Protocol</p>
                                  <p className="text-emerald-300 text-[10px] font-medium">Customized Longevity Consultation</p>
                               </div>
                            </div>
                            <Button className="h-9 px-6 rounded-full bg-white text-emerald-900 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-colors">
                               Book Now
                            </Button>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-6 lg:gap-10 flex-1">
              <Link to="/patient/login" className="hidden sm:block text-[15px] font-medium text-slate-700 hover:text-[#0A2E1F] transition-all">
                Log In
              </Link>
              <Link to="/patient/shop">
                <Button className="rounded-full bg-[#1A1F2C] text-white hover:bg-[#2A303C] px-6 lg:px-8 py-2.5 lg:py-3 h-auto text-[14px] lg:text-[15px] font-bold transition-all border-none shadow-none">
                  Explore Treatments
                </Button>
              </Link>
              <button className="lg:hidden text-slate-800" onClick={() => setMobileMenu(!mobileMenu)}>
                {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main>
        <PageErrorBoundary>
          <Outlet />
        </PageErrorBoundary>
      </main>

      {/* REFINED LUXURY EXECUTIVE FOOTER */}
      <footer className="bg-white pt-24 pb-12 px-6 lg:px-20 border-t border-slate-100 overflow-hidden relative">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-50/30 rounded-full blur-[120px] -mr-64 -mb-64 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
            
            <div className="lg:col-span-2 space-y-10">
              <div className="space-y-6">
                <Link to="/" className="flex items-center gap-4 group">
                  <img src="/logo-icon.png" alt="Peak Health" className="h-14 w-auto mix-blend-multiply contrast-125 transition-transform group-hover:scale-105" />
                  <span className="font-serif italic tracking-tighter text-[#0A2E1F] text-4xl">Peak Health</span>
                </Link>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 leading-relaxed max-w-xs">
                  © {new Date().getFullYear()} Peak Health Technology Group, Inc. <br/> All clinical rights reserved.
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                 <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0A2E1F] text-white shadow-xl shadow-emerald-900/10 border border-emerald-400/20">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest">LegitScript Certified</span>
                 </div>
                 <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white text-[#0A2E1F] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <Flag className="h-4 w-4 text-emerald-600" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Compounded in USA</span>
                 </div>
              </div>

              <div className="flex items-center gap-6 pt-4">
                 <a href="#" className="text-slate-300 hover:text-[#0A2E1F] transition-all hover:scale-110"><Instagram size={20} /></a>
                 <a href="#" className="text-slate-300 hover:text-[#0A2E1F] transition-all hover:scale-110"><Facebook size={20} /></a>
                 <a href="#" className="text-slate-300 hover:text-[#0A2E1F] transition-all hover:scale-110"><Linkedin size={20} /></a>
                 <div className="h-5 w-px bg-slate-100"></div>
                 <div className="flex items-center gap-2 group cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                    <Star size={18} className="text-[#0A2E1F] fill-current" />
                    <span className="text-[10px] font-black text-[#0A0D14] uppercase tracking-widest">Trustpilot</span>
                 </div>
              </div>
            </div>

            <div className="space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Clinical Focus</h4>
               <ul className="space-y-5">
                 {[
                   { name: "Metabolic Optimization" },
                   { name: "Cognitive Performance" },
                   { name: "Longevity Science" },
                   { name: "Biological Recovery" },
                   { name: "Signature Protocols" },
                 ].map(item => (
                   <li key={item.name} className="group cursor-pointer">
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{item.name}</span>
                   </li>
                 ))}
               </ul>
            </div>

            <div className="space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Infrastructure</h4>
               <ul className="space-y-5">
                 {[
                   { name: "How It Works", path: "/how-it-works" },
                   { name: "Patient Login", path: "/patient/login" },
                   { name: "Start Journey", path: "/patient/shop" },
                   { name: "Clinical Blog", path: "/blog" },
                 ].map(item => (
                   <li key={item.name}>
                      <Link to={item.path} className="text-sm font-bold text-slate-700 uppercase tracking-widest hover:text-emerald-600 transition-colors">{item.name}</Link>
                   </li>
                 ))}
               </ul>
            </div>

            <div className="space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Compliance</h4>
               <ul className="space-y-5">
                 {[
                   { name: "Safety Information" },
                   { name: "Consent to Telehealth" },
                   { name: "Privacy Policy" },
                   { name: "Terms of Service" },
                 ].map(item => (
                   <li key={item.name} className="group cursor-pointer">
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{item.name}</span>
                   </li>
                 ))}
               </ul>
            </div>
          </div>

          <div className="pt-16 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12">
             <div className="flex items-center gap-10 opacity-30">
                <div className="flex items-center gap-2">
                   <Lock size={12} />
                   <span className="text-[8px] font-black uppercase tracking-[0.2em]">AES-256 Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                   <ShieldCheck size={12} />
                   <span className="text-[8px] font-black uppercase tracking-[0.2em]">HIPAA Secure</span>
                </div>
             </div>
             
             {/* REFINED SIGNATURE - Less massive, more elegant */}
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-1">Biological Excellence</p>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-[#0A2E1F] leading-none select-none">
                  it's about <span className="text-emerald-600 font-serif italic font-medium">you.</span>
                </h2>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
