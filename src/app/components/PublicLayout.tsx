import { useState, useEffect } from "react";
import { Link, Outlet } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, ChevronDown, X, Menu, ShieldCheck, Lock, Star, 
  Activity, Heart, Pill 
} from "lucide-react";
import { Button, cn } from "./ui/shared.tsx";

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

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showTreatments, setShowTreatments] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#0A0D14] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Announcement Ticker */}
      <div className="bg-[#0A0D14] text-white py-2 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee-fast flex gap-12 items-center text-[10px] font-black uppercase tracking-[0.2em]">
          {[1, 2, 3].map(i => (
            <span key={i} className="flex items-center gap-12">
              <span>⚕️ 50-State Provider Network</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
              <span>🔒 HIPAA SECURE PLATFORM</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
              <span>📦 Free Expedited Delivery</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-500", 
        scrolled ? "bg-white/90 backdrop-blur-xl border-b border-slate-100 py-3 shadow-md" : "bg-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center group">
              <img src="/logo-icon.png" alt="Peak Health" className="h-16 md:h-24 w-auto transition-transform group-hover:scale-105" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <div className="relative" onMouseEnter={() => setShowTreatments(true)} onMouseLeave={() => setShowTreatments(false)}>
                <Link to="/explore-treatments" className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest text-slate-600 hover:text-[#0A0D14] transition-colors py-2">
                  Explore Treatments <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showTreatments && "rotate-180")} />
                </Link>
                
                <AnimatePresence>
                  {showTreatments && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full -left-4 w-[480px] pt-4"
                    >
                      <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 p-4 grid grid-cols-1 gap-2">
                        {treatments.map((t) => (
                          <Link key={t.name} to={t.href} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group" onClick={() => setShowTreatments(false)}>
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", t.bg)}>
                              <t.icon className={cn("h-6 w-6", t.color)} />
                            </div>
                            <div>
                              <p className="font-black text-sm text-[#0A0D14]">{t.name}</p>
                              <p className="text-xs text-slate-400 font-bold">{t.desc}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 ml-auto text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/how-it-works" className="text-[12px] font-black uppercase tracking-widest text-slate-600 hover:text-[#0A0D14] transition-colors">How It Works</Link>
              <Link to="/faq" className="text-[12px] font-black uppercase tracking-widest text-slate-600 hover:text-[#0A0D14] transition-colors">FAQ</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/patient/login" className="hidden sm:block text-[12px] font-black uppercase tracking-widest text-slate-600 hover:text-[#0A0D14]">Sign In</Link>
            <Link to="/patient/shop">
              <Button className="rounded-full bg-[#0A0D14] text-white hover:bg-[#1A1D24] px-8 py-6 font-black text-xs tracking-widest shadow-xl active:scale-95 transition-all">
                GET STARTED
              </Button>
            </Link>
            <button className="lg:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
            <div className="space-y-8">
              <img src="/logo-icon.png" alt="Peak Health" className="h-24 w-auto" />
              <p className="text-slate-400 font-medium leading-relaxed">
                Empowering individuals through clinical rigor and personalized wellness protocols. The future of healthcare is biological.
              </p>
              <div className="flex items-center gap-4">
                 <ShieldCheck className="h-10 w-10 text-emerald-500/20" />
                 <Lock className="h-10 w-10 text-emerald-500/20" />
                 <Star className="h-10 w-10 text-emerald-500/20" />
              </div>
            </div>

            <div className="space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Treatments</h4>
               <ul className="space-y-4">
                 {treatments.map(t => (
                   <li key={t.name}><Link to={t.href} className="text-sm font-black text-slate-600 hover:text-emerald-600 transition-colors">{t.name}</Link></li>
                 ))}
                 <li><Link to="/explore-treatments" className="text-sm font-black text-emerald-600 uppercase tracking-widest">View All</Link></li>
               </ul>
            </div>

            <div className="space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Platform</h4>
               <ul className="space-y-4">
                 <li><Link to="/how-it-works" className="text-sm font-black text-slate-600 hover:text-emerald-600 transition-colors">How It Works</Link></li>
                 <li><Link to="/faq" className="text-sm font-black text-slate-600 hover:text-emerald-600 transition-colors">FAQ</Link></li>
                 <li><Link to="/clinical-research" className="text-sm font-black text-slate-600 hover:text-emerald-600 transition-colors">Clinical Research</Link></li>
                 <li><Link to="/support-hub" className="text-sm font-black text-slate-600 hover:text-emerald-600 transition-colors">Support Hub</Link></li>
               </ul>
            </div>

            <div className="space-y-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Secure Portals</h4>
               <div className="flex flex-col gap-3">
                  <Link to="/patient/login"><Button className="w-full bg-[#0A0D14] text-white text-[10px] font-black uppercase tracking-widest h-12 rounded-xl">Patient Login</Button></Link>
                  <Link to="/doctor/login"><Button variant="outline" className="w-full border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl">Provider Portal</Button></Link>
               </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 text-center space-y-6">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
               © {new Date().getFullYear()} Peak Health Technology Group, Inc. All rights reserved.
             </p>
             <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[#0A0D14] leading-none opacity-10">
               it's about <span className="text-emerald-500 font-serif italic font-medium">you.</span>
             </h2>
          </div>
        </div>
      </footer>
    </div>
  );
}
