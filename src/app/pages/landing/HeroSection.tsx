import { Link } from "react-router";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] lg:min-h-[92vh] flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg,#6ab4d8 0%,#a8cfe8 40%,#c8e2f0 100%)" }}>
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: "radial-gradient(#0d2137 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
      
      {/* Floating blob shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[300px] md:w-[680px] h-[200px] md:h-[340px] bg-white/30 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100 400C100 300 300 500 500 400C700 300 900 500 1100 400C1300 300 1500 500 1700 400" stroke="white" strokeWidth="2" />
          <path d="M-100 500C100 400 300 600 500 500C700 400 900 600 1100 500C1300 400 1500 600 1700 500" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      {/* Headline */}
      <div className="relative z-10 text-center pt-12 md:pt-16 pb-4 px-4">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
          <h1 className="leading-tight flex flex-col items-center">
            <div className="flex items-baseline gap-3 mb-1">
              <span style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }} className="font-medium text-5xl md:text-7xl lg:text-8xl text-white">
                Weight
              </span>
              <span className="font-black text-[2.2rem] sm:text-5xl md:text-6xl lg:text-7xl text-[#0d2137] tracking-tight leading-[1.05]">
                treatment
              </span>
            </div>
            <span className="font-black text-[2.2rem] sm:text-5xl md:text-6xl lg:text-7xl text-[#0d2137] tracking-tight leading-[1.05]">
              that works
            </span>
            <span style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }} className="font-medium text-lg md:text-2xl text-[#0d2137]/80 mt-1 md:mt-2">
              designed around you.
            </span>
          </h1>
        </motion.div>
      </div>

      {/* Models + Floating Badges */}
      <div className="relative z-10 flex-1 flex items-end justify-center px-4">
        <div className="relative w-full max-w-[900px] mx-auto flex justify-center items-end">
          {/* Floating badge left */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.5 }}
            className="absolute left-[2%] md:left-[8%] bottom-[40%] md:bottom-[50%] bg-white/25 backdrop-blur-md border border-white/50 rounded-full px-3 py-1.5 md:px-5 md:py-2 text-[#0d2137] text-[10px] sm:text-xs md:text-sm font-bold whitespace-nowrap z-20">
            Curb hunger
          </motion.div>
          {/* Floating badge right */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.7 }}
            className="absolute right-[2%] md:right-[5%] bottom-[40%] md:bottom-[50%] bg-white/25 backdrop-blur-md border border-white/50 rounded-full px-3 py-1.5 md:px-5 md:py-2 text-[#0d2137] text-[10px] sm:text-xs md:text-sm font-bold whitespace-nowrap z-20">
            Sustainable results
          </motion.div>
          {/* Hero image */}
          <img src="/generatedImages/image1.png" alt="Peak Health patients" className="w-[120%] md:w-full max-w-[600px] md:max-w-none object-cover object-top -mb-2 md:mb-0" style={{ maxHeight:"65vh" }} />
        </div>
      </div>

      {/* CTA Bar pinned to bottom */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-3 pb-8 px-4 pt-4 sm:pt-2">
        <Link to="/quiz/select-treatment"
          className="w-full sm:w-auto text-center bg-[#0d2137] text-white font-bold text-sm md:text-base py-4 px-10 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:bg-slate-900 transition-all">
          Lose weight for just $146/mo*
        </Link>
        <Link to="/quiz/select-treatment"
          className="w-full sm:w-auto flex justify-center items-center gap-2 bg-white text-[#0d2137] font-bold text-sm md:text-base py-4 px-10 rounded-full border border-slate-200 hover:bg-slate-50 transition-all">
          Explore Treatments <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}

