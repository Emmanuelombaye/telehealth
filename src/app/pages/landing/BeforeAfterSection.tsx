import { Link } from "react-router";
import { Star } from "lucide-react";

const results = [
  { img:"/generatedImages/image1-2.png", name:"Sarah M.", age:"38", lost:"52 lbs", months:"5 Months", tag:"Semaglutide" },
  { img:"/generatedImages/image3.png", name:"James R.", age:"45", lost:"41 lbs", months:"4 Months", tag:"Tirzepatide" },
];

export function BeforeAfterSection() {
  return (
    <section className="py-20 px-6 bg-[#f7f9fc]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-blue-500 block mb-2">Real Patient Results</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0a0d14] tracking-tight m-0">See the transformation.</h2>
          <p className="mt-3 text-slate-500 text-base font-medium">Thousands of patients have achieved life-changing results with Peak Health GLP-1 protocols.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {results.map((r,i) => (
            <div key={i} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-[#e8edf3]">
              <div className="relative">
                <img src={r.img} alt={`${r.name} transformation`} className="w-full h-[240px] sm:h-[280px] object-cover" />
                <span className="absolute top-3 left-3 bg-orange-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Before</span>
                <span className="absolute top-3 right-3 bg-green-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">After</span>
              </div>
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-black text-[#0a0d14]">Lost {r.lost}</span>
                  <span className="text-xs text-slate-500 font-semibold">in {r.months}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[#0a0d14]">{r.name}</span>
                    <span className="text-xs text-slate-500 ml-1">Age {r.age}</span>
                  </div>
                  <span className="text-[11px] font-bold bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full">{r.tag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rating card */}
        <div className="bg-white rounded-[20px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-[#e8edf3]">
          <div className="flex items-center gap-4 lg:gap-8 w-full md:w-auto justify-center md:justify-start">
            <div className="text-center">
              <div className="flex gap-0.5 justify-center mb-1">{[1,2,3,4,5].map(i=><Star key={i} size={16} fill="#f97316" color="#f97316" />)}</div>
              <span className="text-xs font-bold text-[#0a0d14] block">4.9 / 5.0</span>
              <span className="text-[11px] text-slate-500">Google Reviews</span>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <div className="flex gap-0.5 justify-center mb-1">{[1,2,3,4,5].map(i=><Star key={i} size={16} fill="#22c55e" color="#22c55e" />)}</div>
              <span className="text-xs font-bold text-[#0a0d14] block">Excellent</span>
              <span className="text-[11px] text-slate-500">1,200+ Reviews</span>
            </div>
          </div>
          <Link to="/quiz/select-treatment" className="w-full md:w-auto text-center bg-[#0d2137] text-white py-3 px-8 rounded-full font-bold text-sm hover:bg-slate-800 transition-colors">
            Start Your Journey →
          </Link>
        </div>
      </div>
    </section>
  );
}
