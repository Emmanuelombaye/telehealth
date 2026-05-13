import { Link } from "react-router";
import { Star, ShieldCheck, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

const results = [
  { beforeImg: "/generatedImages/image1-7.png", afterImg: "/generatedImages/image1-8.png", name: "Sarah M.", primaryStat: "52", statLabel: "lbs", subtitle: "in 5 Months", tag: "GLP-1 Patient", link: "/quiz/weight-loss/reviews", type: "weight" },
  { beforeImg: "/generatedImages/image1-9.png", afterImg: "/generatedImages/image1-10.png", name: "Chris B.", primaryStat: "Lean", statLabel: "Muscle", subtitle: "in 3 Months", tag: "Sermorelin Patient", link: "/quiz/muscle/reviews", type: "other" },
  { beforeImg: "/generatedImages/image1-5.png", afterImg: "/generatedImages/image1-6.png", name: "David L.", primaryStat: "Sharp", statLabel: "Focus", subtitle: "in 2 Months", tag: "NAD+ Patient", link: "/quiz/longevity/reviews", type: "other" },
];

const marqueeResults = [...results, ...results, ...results, ...results]; // Quadruple for ultra-smooth infinite loop

export function BeforeAfterSection() {
  return (
    <section className="py-24 px-0 bg-[#f7f9fc] overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-4">
          <span className="text-[11px] font-extrabold tracking-[0.3em] uppercase text-blue-600 block mb-3">Real Patient Results</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0a0d14] tracking-tight m-0 leading-[1.1]">
            See the <span className="font-serif italic font-medium text-emerald-600">transformation.</span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Thousands of patients have achieved life-changing results with Peak Health clinical protocols.
          </p>
        </div>
      </div>

      {/* Infinite Marquee */}
      <div className="mt-16 mb-20 relative w-full overflow-hidden flex py-4">
        {/* Fade Outlays */}
        <div className="absolute top-0 bottom-0 left-0 w-24 md:w-48 bg-gradient-to-r from-[#f7f9fc] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-24 md:w-48 bg-gradient-to-l from-[#f7f9fc] to-transparent z-10 pointer-events-none" />

        <motion.div 
          className="flex gap-6 w-max pl-6"
          animate={{ x: ["0%", "-25%"] }} // Adjust based on array duplication (4x = 25%)
          transition={{ ease: "linear", duration: 45, repeat: Infinity }}
        >
          {marqueeResults.map((r,i) => (
            <Link key={i} to={r.link} className="block w-[480px] md:w-[560px] h-[320px] shrink-0 bg-white rounded-[32px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-slate-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] active:scale-[0.98] relative group">
              
              {/* Split Images */}
              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full relative">
                  <img src={r.beforeImg} alt="Before" className="w-full h-full object-cover" />
                </div>
                <div className="w-1/2 h-full relative">
                  <img src={r.afterImg} alt="After" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Top Badges */}
              <span className="absolute top-4 left-4 bg-orange-50 text-orange-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm z-10">Before</span>
              <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm z-10">After</span>

              {/* Bottom Gradient Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />

              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex items-end justify-between">
                
                {/* Left Text */}
                <div className="text-white">
                  <div className="flex items-center gap-1.5 mb-1 opacity-90">
                    <span className="font-bold text-lg md:text-xl tracking-tight">{r.type === 'weight' ? 'Lost' : 'Achieved'}</span>
                    {r.type === 'weight' && <ArrowDown className="h-4 w-4 text-emerald-400 stroke-[3]" />}
                  </div>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className="font-black text-5xl md:text-6xl tracking-tighter">{r.primaryStat}</span>
                    <span className="font-medium text-xl md:text-2xl text-white/80 tracking-tight">{r.statLabel}</span>
                  </div>
                  <p className="font-bold text-sm mt-3 opacity-90 tracking-wide">{r.subtitle}</p>
                </div>

                {/* Right Verified Pill */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-2 flex items-center gap-2 shadow-lg mb-1 transition-colors group-hover:bg-white/20">
                  <span className="text-white text-xs font-bold whitespace-nowrap">{r.name}</span>
                  <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3 text-white" />
                    <span className="text-[10px] font-black italic text-white uppercase tracking-wider whitespace-nowrap">Verified {r.tag}</span>
                  </div>
                </div>
              </div>

            </Link>
          ))}
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Rating card */}
        <div className="bg-white rounded-[24px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-[#e8edf3] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Star className="h-40 w-40" />
          </div>
          <div className="flex items-center gap-4 lg:gap-12 w-full md:w-auto justify-center md:justify-start relative z-10">
            <div className="text-center">
              <div className="flex gap-0.5 justify-center mb-1.5">{[1,2,3,4,5].map(i=><Star key={i} size={18} fill="#f97316" color="#f97316" />)}</div>
              <span className="text-sm font-black text-[#0a0d14] block">4.9 / 5.0</span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Google Reviews</span>
            </div>
            <div className="w-px h-12 bg-slate-100" />
            <div className="text-center">
              <div className="flex gap-0.5 justify-center mb-1.5">{[1,2,3,4,5].map(i=><Star key={i} size={18} fill="#22c55e" color="#22c55e" />)}</div>
              <span className="text-sm font-black text-[#0a0d14] block">Excellent</span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">1,200+ Reviews</span>
            </div>
          </div>
          <Link to="/quiz/select-treatment" className="w-full md:w-auto text-center bg-[#0a0d14] text-white py-4 px-10 rounded-full font-bold text-sm hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/10 relative z-10">
            Start Your Journey →
          </Link>
        </div>
      </div>
    </section>
  );
}
