import { useState, useEffect, Suspense } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { AuthLoadingScreen } from "./ProtectedRoute";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  ArrowRight, ChevronDown, X, Menu, ShieldCheck, Lock, Star, 
  Activity, Heart, Pill, Plus, Plane, MapPin, Shield, Flag,
  Instagram, Facebook, Linkedin, ExternalLink, HeartPulse,
  Brain, Zap, Sparkles, Rocket, Microscope, Wind, Layers,
  ChevronUp, ShieldAlert, ChevronRight, Globe2
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
    const handleScroll = () => {
      // Small debounce/threshold for stability
      if (window.scrollY > 20 && !scrolled) setScrolled(true);
      if (window.scrollY <= 20 && scrolled) setScrolled(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenu) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.touchAction = "auto";
    }
    return () => { 
      document.body.style.overflow = "unset"; 
      document.body.style.touchAction = "auto";
    };
  }, [mobileMenu]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#0A0D14] selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* GLOBAL SCROLL PROGRESS */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-emerald-600 z-[201] origin-left"
        style={{ scaleX }}
      />

      {/* BACK TO TOP BUTTON */}
      <AnimatePresence>
        {scrolled && !mobileMenu && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed right-8 bottom-8 h-14 w-14 rounded-full bg-[#0A2E1F] text-white flex items-center justify-center shadow-2xl hover:bg-emerald-600 transition-all z-[60] group border border-emerald-400/20"
          >
             <ChevronUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sticky Header Wrapper */}
      <div className="sticky top-0 z-[100]">
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
          "transition-all duration-500 bg-white/95 backdrop-blur-md border-b border-slate-100 relative z-[101]", 
          scrolled ? "py-3 shadow-md" : "py-5 shadow-sm"
        )}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center group w-fit">
                <img 
                  src="/PeakHealthLogo.png" 
                  alt="Peak Health" 
                  className={cn(
                    "w-auto transition-all duration-700 group-hover:scale-105",
                    scrolled ? "h-16 md:h-20" : "h-20 md:h-28"
                  )} 
                />
              </Link>
            </div>

            {/* Middle: Links (Hidden on Mobile) */}
            <nav className="hidden lg:flex items-center justify-center gap-8 lg:gap-12 flex-1">
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-3 md:gap-6 flex-shrink-0">
              <Link to="/patient/login" className="hidden md:block text-[14px] font-medium text-slate-700 hover:text-[#0A2E1F] transition-all">
                Log In
              </Link>
              <Link to="/patient/shop" className="hidden md:block flex-shrink-0">
                <Button className="rounded-full bg-[#1A1F2C] text-white hover:bg-[#2A303C] px-3 md:px-6 py-2 h-9 md:h-11 text-[11px] md:text-[14px] font-bold transition-all border-none shadow-none whitespace-nowrap">
                  <span className="hidden xs:inline">Explore </span>Treatments
                </Button>
              </Link>
              <button 
                className="lg:hidden text-slate-800 p-2 hover:bg-slate-50 rounded-xl transition-all" 
                onClick={() => setMobileMenu(true)}
                aria-label="Open Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* PERMANENT FULL-SCREEN MOBILE OVERLAY */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="lg:hidden fixed inset-0 bg-white z-[999] flex flex-col"
          >
            {/* Overlay Header */}
            <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center">
                <img src="/PeakHealthLogo.png" alt="Peak Health" className="h-20 w-auto" />
              </div>
              <button 
                onClick={() => setMobileMenu(false)}
                className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-800 active:scale-90 transition-transform"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 space-y-10">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Clinical Protocols</h4>
                <div className="space-y-4">
                  {treatments.map((t) => (
                    <Link 
                      key={t.name} 
                      to={t.href} 
                      className="flex items-center gap-4 p-5 rounded-[2rem] bg-slate-50 active:bg-emerald-50 transition-colors group"
                      onClick={() => setMobileMenu(false)}
                    >
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", t.bg)}>
                        <t.icon className={cn("h-6 w-6", t.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-[#0A2E1F] uppercase tracking-wide">{t.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">{t.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-200" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Bio-Optimization</h4>
                <div className="grid grid-cols-2 gap-4">
                  {bioOptimizers.map((b) => (
                    <Link 
                      key={b.name} 
                      to={b.href} 
                      className="flex flex-col gap-4 p-6 rounded-[2.5rem] border border-slate-100 active:bg-slate-50 transition-all group"
                      onClick={() => setMobileMenu(false)}
                    >
                      <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", b.bg)}>
                         <b.icon className={cn("h-5 w-5", b.color)} />
                      </div>
                      <span className="font-black text-[12px] text-[#0A2E1F] uppercase tracking-tight leading-tight">{b.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100 space-y-8">
                <Link to="/how-it-works" className="flex items-center justify-between" onClick={() => setMobileMenu(false)}>
                  <span className="text-xl font-black text-[#0A2E1F] uppercase tracking-tighter">How It Works</span>
                  <ArrowRight className="h-6 w-6 text-slate-300" />
                </Link>
                <Link to="/patient/login" className="flex items-center justify-between" onClick={() => setMobileMenu(false)}>
                  <span className="text-xl font-black text-[#0A2E1F] uppercase tracking-tighter">Patient Login</span>
                  <ArrowRight className="h-6 w-6 text-slate-300" />
                </Link>
              </div>
            </div>

            {/* Fixed Footer Action */}
            <div className="p-6 bg-white border-t border-slate-100 sticky bottom-0">
               <Link to="/patient/shop" onClick={() => setMobileMenu(false)}>
                  <Button className="w-full h-16 rounded-[2rem] bg-[#0A2E1F] text-white font-black uppercase tracking-[0.2em] text-[14px] shadow-2xl shadow-emerald-900/30">
                    Get Started Now
                  </Button>
               </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main>
        <PageErrorBoundary>
          <Suspense fallback={<AuthLoadingScreen />}>
            <Outlet />
          </Suspense>
        </PageErrorBoundary>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#f8f9fa] pt-16 pb-10 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Main White Card */}
          <div className="bg-white rounded-[3rem] p-8 md:p-16 w-full relative mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
              
              {/* Col 1: Logo & Info */}
              <div className="md:col-span-4 flex flex-col gap-8">
                <Link to="/" className="w-fit">
                  <img src="/PeakHealthLogo.png" alt="Peak Health" className="h-12 md:h-16 w-auto" />
                </Link>
                <p className="text-[13px] text-slate-500 font-medium">
                  © {new Date().getFullYear()} Peak Health, Inc. All rights reserved.
                </p>
                
                {/* Badges */}
                <div className="flex items-center gap-4 flex-wrap">
                   {/* LegitScript Mock */}
                   <div className="flex flex-col items-center justify-center bg-[#0e1d3e] text-white p-2 rounded-lg w-16 h-16 relative shadow-sm">
                      <ShieldCheck className="h-4 w-4 mb-1 text-emerald-400" />
                      <span className="text-[6px] font-bold tracking-wider uppercase text-center leading-tight">LegitScript<br/>Certified</span>
                   </div>
                   {/* Compounded in USA Mock */}
                   <div className="flex flex-col items-center justify-center bg-white border border-slate-200 text-[#0e1d3e] p-2 rounded-t-xl rounded-b-3xl w-16 h-16 shadow-sm">
                      <span className="text-[5px] font-black tracking-widest uppercase text-center mb-1 leading-tight">Compounded IN<br/>USA</span>
                      <Flag className="h-3 w-3 text-red-600" />
                   </div>
                   {/* HIPAA Mock */}
                   <div className="flex items-center gap-2">
                      <Lock className="h-8 w-8 text-indigo-900" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-indigo-900 leading-none mb-0.5">HIPAA</span>
                        <span className="text-[8px] font-medium text-indigo-900 leading-none">COMPLIANT</span>
                      </div>
                   </div>
                </div>

                {/* Social Icons */}
                <div className="flex items-center gap-5 pt-2">
                  <Instagram className="h-5 w-5 text-slate-800 hover:text-emerald-600 cursor-pointer transition-colors" />
                  <Facebook className="h-5 w-5 text-slate-800 hover:text-emerald-600 cursor-pointer transition-colors" />
                  <Linkedin className="h-5 w-5 text-slate-800 hover:text-emerald-600 cursor-pointer transition-colors" />
                  <div className="flex items-center gap-1.5 cursor-pointer group">
                    <Star className="h-5 w-5 text-slate-800 fill-slate-800 group-hover:text-emerald-600 group-hover:fill-emerald-600 transition-colors" />
                    <span className="text-[17px] font-bold text-slate-800 group-hover:text-emerald-600 transition-colors tracking-tight">Trustpilot</span>
                  </div>
                </div>
              </div>

              {/* Col 2: Treatments */}
              <div className="md:col-span-3 lg:col-span-3">
                <h4 className="text-[14px] text-slate-400 mb-6">Treatments</h4>
                <ul className="space-y-5">
                  <li className="flex flex-col gap-0.5">
                    <Link to="/treatments/weight-loss" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Personalized Tirzepatide+</Link>
                    <span className="text-[13px] text-slate-500">Weight Loss</span>
                  </li>
                  <li className="flex flex-col gap-0.5">
                    <Link to="/treatments/weight-loss" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Personalized Semaglutide+</Link>
                    <span className="text-[13px] text-slate-500">Weight Loss</span>
                  </li>
                  <li className="flex flex-col gap-0.5">
                    <Link to="/bio/nad-plus" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">NAD+</Link>
                    <span className="text-[13px] text-slate-500">Longevity</span>
                  </li>
                  <li className="flex flex-col gap-0.5">
                    <Link to="/bio/peptides" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Sermorelin</Link>
                    <span className="text-[13px] text-slate-500">Muscle Recovery</span>
                  </li>
                  <li className="flex flex-col gap-0.5">
                    <span className="text-[16px] text-slate-700">Peptides</span>
                    <span className="text-[13px] text-slate-500">Coming Soon</span>
                  </li>
                </ul>
              </div>

              {/* Col 3: Peak Health */}
              <div className="md:col-span-3 lg:col-span-2">
                <h4 className="text-[14px] text-slate-400 mb-6">Peak Health</h4>
                <ul className="space-y-4">
                  <li><Link to="/how-it-works" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">How It Works</Link></li>
                  <li><Link to="/patient/login" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Log In</Link></li>
                  <li><Link to="/explore-treatments" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Explore Treatments</Link></li>
                  <li className="flex items-center gap-2">
                     <span className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer">Referral Program</span>
                     <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                  </li>
                  <li><Link to="/faq" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">FAQ</Link></li>
                  <li><Link to="/blog" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Blog</Link></li>
                </ul>
              </div>

              {/* Col 4: Medical */}
              <div className="md:col-span-2 lg:col-span-3 relative flex flex-col justify-between">
                <div>
                  <h4 className="text-[14px] text-slate-400 mb-6">Medical</h4>
                  <ul className="space-y-4">
                    <li><Link to="/safety" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Safety Information</Link></li>
                    <li><Link to="/consent" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Consent to Telehealth</Link></li>
                    <li><Link to="/code-of-conduct" className="text-[16px] text-slate-700 hover:text-emerald-600 transition-colors">Physician Code of Conduct</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* "it's about you" text at bottom right */}
            <div className="mt-16 md:absolute md:bottom-12 md:right-16 text-right">
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-[#2D3748] leading-none select-none">
                  it's about <span className="text-emerald-500 font-serif italic">you.</span>
                </h2>
            </div>
          </div>

          {/* Bottom Links (Outside the card) */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8 px-4 py-2 text-[13px] text-slate-500">
             <Link to="/llms" className="hover:text-emerald-600 underline decoration-slate-300 underline-offset-4">LLMs.txt</Link>
             <Link to="/terms" className="hover:text-emerald-600 underline decoration-slate-300 underline-offset-4">Terms of Service</Link>
             <Link to="/privacy" className="hover:text-emerald-600 underline decoration-slate-300 underline-offset-4">Privacy Policy</Link>
             <Link to="/refund" className="hover:text-emerald-600 underline decoration-slate-300 underline-offset-4">Refund Policy</Link>
             <Link to="/shipping" className="hover:text-emerald-600 underline decoration-slate-300 underline-offset-4">Shipping Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
