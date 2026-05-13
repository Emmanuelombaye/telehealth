import { motion } from "framer-motion";
import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";

export function BioOptimizationSection() {
  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-extrabold tracking-[0.3em] uppercase text-orange-500 block mb-2">
            Cognitive & Metabolic Edge
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#0a0d14] tracking-tight m-0 leading-[1.1]">
            Rewrite your <span className="font-serif italic font-medium text-emerald-600">baseline.</span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Experience the profound difference of clinical bio-optimization protocols designed for high performers.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Side-by-Side Comparison Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative pb-12">
            
            {/* Left Card: Fatigued */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#F3F4F6] rounded-[32px] overflow-hidden relative group aspect-[4/5] md:aspect-square"
            >
              <img 
                src="/generatedImages/image1-5.png" 
                alt="Fatigued and Brain Fog" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>
              
              <div className="absolute top-6 left-6 z-10">
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm rounded-full px-4 py-2 flex items-center">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Fatigued & Brain Fog
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right Card: Energized */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#E6F0FD] rounded-[32px] overflow-hidden relative group aspect-[4/5] md:aspect-square"
            >
              <img 
                src="/generatedImages/image1-6.png" 
                alt="Sharp and Energized" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent"></div>
              
              <div className="absolute top-6 left-6 z-10">
                <div className="bg-[#00C881] shadow-[0_4px_12px_rgba(0,200,129,0.3)] rounded-full px-4 py-2 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">
                    Sharp & Energized
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Overlapping Bottom Button */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 w-full flex justify-center px-4">
              <Link to="/quiz/select-treatment">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-slate-100 px-6 md:px-10 py-4 md:py-5 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest">
                    Final Step: Medical Questionnaire
                  </span>
                </motion.div>
              </Link>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
