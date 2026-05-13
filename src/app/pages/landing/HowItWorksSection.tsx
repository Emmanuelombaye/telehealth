import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

const steps = [
  { n:"01", title:"Check Eligibility", desc:"Complete a short medical questionnaire designed by our clinical team. Takes under 3 minutes.", icon:"🩺" },
  { n:"02", title:"Provider Review", desc:"A U.S. board-certified physician reviews your intake and authorizes your personalized protocol.", icon:"👨‍⚕️" },
  { n:"03", title:"Delivered to You", desc:"Your medication ships from a licensed U.S. compounding pharmacy directly to your door.", icon:"📦" },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-extrabold tracking-[0.3em] uppercase text-orange-500 block mb-2">The Process</span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#0a0d14] tracking-tight m-0 leading-[1.1]">Simple. Fast. <span className="font-serif italic font-medium text-emerald-600">Clinical.</span></h2>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Mockup Column */}
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full blur-[100px] opacity-30 -z-10"></div>
            <img 
              src="/generatedImages/image1-4.png" 
              alt="Peak Health App Mockup" 
              className="w-full max-w-[500px] mx-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[40px]" 
            />
          </div>

          {/* Steps Column */}
          <div className="w-full lg:w-1/2 space-y-6">
            {steps.map((s,i) => (
              <div key={i} className="bg-[#f7f9fc] rounded-[32px] p-8 relative overflow-hidden border border-[#e8edf3] flex gap-6 items-start group hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all duration-500">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">{s.icon}</div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">{s.n}</span>
                    <h3 className="text-xl font-black text-[#0a0d14]">{s.title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm md:text-[15px] leading-relaxed m-0">{s.desc}</p>
                </div>
              </div>
            ))}
            
            <div className="pt-6">
              <Link to="/quiz/select-treatment" className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#0d2137] text-white py-4 px-10 rounded-full font-bold text-base hover:bg-slate-900 transition-all shadow-xl shadow-blue-900/10">
                Get Started Today <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
