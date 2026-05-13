import { Link } from "react-router";

const steps = [
  { n:"01", title:"Check Eligibility", desc:"Complete a short medical questionnaire designed by our clinical team. Takes under 3 minutes.", icon:"🩺" },
  { n:"02", title:"Provider Review", desc:"A U.S. board-certified physician reviews your intake and authorizes your personalized protocol.", icon:"👨‍⚕️" },
  { n:"03", title:"Delivered to You", desc:"Your medication ships from a licensed U.S. compounding pharmacy directly to your door.", icon:"📦" },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-orange-500 block mb-2">How It Works</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0a0d14] tracking-tight m-0">Simple. Fast. Clinical.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s,i) => (
            <div key={i} className="bg-[#f7f9fc] rounded-[28px] p-8 md:p-10 relative overflow-hidden border border-[#e8edf3]">
              <span className="absolute top-4 right-6 text-5xl md:text-6xl font-black text-slate-200 italic leading-none">{s.n}</span>
              <div className="text-4xl mb-5">{s.icon}</div>
              <h3 className="text-xl font-black text-[#0a0d14] mb-2.5">{s.title}</h3>
              <p className="text-slate-500 text-sm md:text-[15px] leading-relaxed m-0">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/quiz/select-treatment" className="inline-block bg-[#0d2137] text-white py-3.5 px-8 rounded-full font-bold text-sm hover:bg-slate-800 transition-colors">
            Get Started Today →
          </Link>
        </div>
      </div>
    </section>
  );
}
