import { Link } from "react-router";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

const results = [
  { img:"/generatedImages/image1-2.png", name:"Sarah M.", age:"38", lost:"52 lbs", months:"5 Months", tag:"Semaglutide", link:"/quiz/weight-loss/reviews" },
  { img:"/generatedImages/image3.png", name:"James R.", age:"45", lost:"41 lbs", months:"4 Months", tag:"Tirzepatide", link:"/quiz/weight-loss/reviews" },
  { img:"/generatedImages/image1-8.png", name:"Emily T.", age:"42", lost:"38 lbs", months:"6 Months", tag:"Semaglutide", link:"/quiz/weight-loss/reviews" },
  { img:"/generatedImages/image1-10.png", name:"Chris B.", age:"38", lost:"Built Muscle", months:"3 Months", tag:"Sermorelin", link:"/quiz/muscle/reviews" },
  { img:"/generatedImages/image1-6.png", name:"David L.", age:"55", lost:"Regained Focus", months:"2 Months", tag:"NAD+", link:"/quiz/longevity/reviews" },
];

const marqueeResults = [...results, ...results, ...results]; // Triple for ultra-smooth infinite loop

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
      <div className="mt-16 mb-16 relative w-full overflow-hidden flex py-4">
        {/* Fade Outlays */}
        <div className="absolute top-0 bottom-0 left-0 w-24 md:w-48 bg-gradient-to-r from-[#f7f9fc] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-24 md:w-48 bg-gradient-to-l from-[#f7f9fc] to-transparent z-10 pointer-events-none" />

        <motion.div 
          className="flex gap-6 w-max pl-6"
          animate={{ x: ["0%", "-33.333333%"] }}
          transition={{ ease: "linear", duration: 35, repeat: Infinity }}
        >
          {marqueeResults.map((r,i) => (
            <Link key={i} to={r.link} className="block w-[300px] shrink-0 bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <div className="relative">
                <img src={r.img} alt={`${r.name} transformation`} className="w-full h-[280px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent pointer-events-none" />
                {r.lost.includes("lbs") && (
                  <>
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Before</span>
                    <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">After</span>
                  </>
                )}
              </div>
              <div className="p-5 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-black text-[#0a0d14]">{r.lost.includes("lbs") ? `Lost ${r.lost}` : r.lost}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">in {r.months}</span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                  <div>
                    <span className="text-sm font-bold text-[#0a0d14]">{r.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">{r.age} yrs</span>
                  </div>
                  <span className="text-[9px] font-black tracking-widest uppercase bg-blue-50/50 text-blue-600 px-2 py-1 rounded-md border border-blue-100/50">{r.tag}</span>
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
