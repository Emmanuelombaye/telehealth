import { Link } from "react-router";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] lg:min-h-[92vh] flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg,#6ab4d8 0%,#a8cfe8 40%,#c8e2f0 100%)" }}>
      {/* Floating blob shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[300px] md:w-[680px] h-[200px] md:h-[340px] bg-white/20 rounded-full blur-md" />
        <svg className="absolute left-2 md:left-6 bottom-24 md:bottom-32 opacity-40 hidden sm:block" width="90" height="120" viewBox="0 0 90 120">
          {[10,18,26,34,42,50,58,66,74,82].map((x,i)=>(
            <rect key={i} x={x} y={120-(i%3===0?60:i%3===1?40:80)} width="5" rx="2" height={i%3===0?60:i%3===1?40:80} fill="rgba(255,255,255,0.6)" />
          ))}
        </svg>
      </div>

      {/* Headline */}
      <div className="relative z-10 text-center pt-12 md:pt-16 pb-4 px-4">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
          <h1 className="leading-tight flex flex-col items-center">
            <span style={{ fontFamily:"Georgia,serif", fontStyle:"italic", color:"#F4A442" }} className="font-bold text-5xl md:text-6xl lg:text-7xl mb-1">
              Weight Loss
            </span>
            <span className="font-black text-[2.2rem] sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05]">
              treatment that works
            </span>
            <span style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }} className="font-medium text-lg md:text-2xl text-white/90 mt-1 md:mt-2">
              designed around you.
            </span>
          </h1>
        </motion.div>
      </div>

      {/* Models + Floating Badges */}
      <div className="relative z-10 flex-1 flex items-end justify-center px-4">
        <div className="relative w-full max-w-[800px] mx-auto flex justify-center items-end">
          {/* Floating badge left */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.5 }}
            className="absolute left-[2%] md:left-[8%] bottom-[45%] md:bottom-[54%] bg-white/25 backdrop-blur-md border border-white/50 rounded-full px-3 py-1.5 md:px-5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap z-20">
            Curb hunger
          </motion.div>
          {/* Floating badge right */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.7 }}
            className="absolute right-[2%] md:right-[5%] bottom-[45%] md:bottom-[54%] bg-white/25 backdrop-blur-md border border-white/50 rounded-full px-3 py-1.5 md:px-5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap z-20">
            Weight loss support
          </motion.div>
          {/* Hero image */}
          <img src="/generatedImages/image1.png" alt="Peak Health patients" className="w-[120%] md:w-full max-w-[500px] md:max-w-none object-cover object-top -mb-2 md:mb-0" style={{ maxHeight:"60vh" }} />
        </div>
      </div>

      {/* CTA Bar pinned to bottom */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-3 pb-8 px-4 pt-4 sm:pt-2">
        <Link to="/quiz/select-treatment"
          className="w-full sm:w-auto text-center bg-white text-[#0a0d14] font-bold text-sm md:text-base py-3.5 px-6 md:px-8 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:bg-slate-50 transition-colors">
          Lose weight for just $146/mo*
        </Link>
        <Link to="/quiz/select-treatment"
          className="w-full sm:w-auto flex justify-center items-center gap-2 bg-[#0d2137] text-white font-bold text-sm md:text-base py-3.5 px-6 md:px-8 rounded-full hover:bg-slate-800 transition-colors">
          Explore Treatments <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}
