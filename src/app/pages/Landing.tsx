import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronDown, Star, Activity, Heart, Pill, Brain, ShieldCheck, Zap } from "lucide-react";
import { Button, cn } from "../components/ui/shared.tsx";

const treatments = [
  {
    category: "Weight Management",
    title: "Personalized Semaglutide+",
    desc: "A precision weekly protocol designed to optimize metabolic appetite control and weight management.",
    href: "/quiz/select-treatment",
    bg: "bg-emerald-50",
    icon: Activity,
    color: "text-emerald-600"
  },
  {
    category: "Weight Management",
    title: "Personalized Tirzepatide+",
    desc: "Advanced dual-action biological optimization for significant weight reduction and insulin health.",
    href: "/quiz/select-treatment",
    bg: "bg-teal-50",
    icon: Zap,
    color: "text-teal-600"
  },
  {
    category: "Anti-Aging & Focus",
    title: "NAD+ Longevity",
    desc: "Replenish cellular energy levels and support DNA repair with high-potency NAD+ replenishment.",
    href: "/quiz/select-treatment",
    bg: "bg-blue-50",
    icon: Brain,
    color: "text-blue-600"
  },
  {
    category: "Performance",
    title: "Sermorelin Recovery",
    desc: "Biological optimization of natural growth hormone production for enhanced energy and muscle recovery.",
    href: "/quiz/select-treatment",
    bg: "bg-indigo-50",
    icon: Pill,
    color: "text-indigo-600"
  }
];

const faqs = [
  {
    q: "What is Peak Health?",
    a: "Peak Health is an elite telehealth ecosystem connecting high-intent patients with board-certified providers and licensed pharmacies for personalized biological optimization."
  },
  {
    q: "Who is eligible for treatment?",
    a: "Eligibility is determined through a secure clinical review. Our protocols are designed for patients seeking professional-grade metabolic and longevity management."
  },
  {
    q: "How does the process work?",
    a: "1. Clinical Intake. 2. Physician Review. 3. Pharmacy Dispatch. The entire journey is managed within our secure HIPAA-compliant infrastructure."
  },
  {
    q: "Are these medications authentic?",
    a: "Every treatment is prepared by U.S. licensed pharmacies operating under strict federal oversight, ensuring pharmaceutical-grade purity and precision."
  }
];

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-white font-sans text-[#0A0D14] selection:bg-emerald-100">
      
      {/* Hero Section - Compact & Authoritative */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-28 px-6 text-center max-w-5xl mx-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Precision Telehealth Protocol</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-[#0A2E1F]">
            Biological optimization <br/><span className="text-emerald-600 italic font-serif">designed</span> for you.
          </h1>
          <p className="mt-4 text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Access board-certified physicians and premium pharmaceutical-grade treatments from the comfort of your residence.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <Link to="/quiz/select-treatment">
            <Button className="h-14 px-10 rounded-2xl bg-[#0A2E1F] text-white hover:bg-emerald-950 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-900/10 transition-all">
              See if I qualify
            </Button>
          </Link>
          <Link to="/explore-treatments" className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors p-4">
            Explore All Protocols
          </Link>
        </motion.div>
      </section>

      {/* Trust Metrics Strip - Condensed */}
      <section className="border-y border-slate-100 bg-[#F8FAF9] py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Patient Outcomes", val: "15,000+" },
              { label: "Board Physicians", val: "50 States" },
              { label: "Success Rate", val: "94%" },
              { label: "Delivery Speed", val: "2 Days" },
            ].map((res, i) => (
              <div key={i} className="text-center space-y-0.5 border-r border-slate-200 last:border-none">
                <p className="text-3xl font-black text-[#0A2E1F] tracking-tighter">{res.val}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{res.label}</p>
              </div>
            ))}
        </div>
      </section>

      {/* How it Works - High Density */}
      <section className="py-20 md:py-24 px-6 max-w-7xl mx-auto" id="how-it-works">
        <div className="text-center mb-16 space-y-2">
           <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">Our Infrastructure</span>
           <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#0A0D14]">Engineered for delivery.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {[
            { step: "01", title: "Clinical Intake", desc: "A precision-guided questionnaire establishes your medical baseline.", icon: ShieldCheck },
            { step: "02", title: "Provider Review", desc: "U.S. board-certified physicians verify and authorize your protocol.", icon: Activity },
            { step: "03", title: "Global Fulfillment", desc: "Licensed pharmacies dispatch treatment directly to your residence.", icon: CheckCircle2 }
          ].map((s, i) => (
            <div key={i} className="relative group bg-white rounded-[32px] p-10 border border-slate-100 shadow-xl shadow-slate-100/30 hover:border-emerald-200 transition-all duration-500">
              <div className="mb-8">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                    <s.icon className="h-6 w-6" />
                 </div>
                 <span className="text-4xl font-black text-slate-100 italic group-hover:text-emerald-50 transition-colors">{s.step}</span>
              </div>
              <h3 className="text-xl font-black text-[#0A0D14] mb-3">{s.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop / Treatments - Optimized Cards */}
      <section className="py-20 bg-[#F8FAF9] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h4 className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Available Treatments</h4>
              <h2 className="text-4xl font-black tracking-tight text-[#0A0D14]">Clinical Selection.</h2>
            </div>
            <Link to="/explore-treatments" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#0A2E1F] transition-colors mb-2">View All Protocol Details</Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {treatments.map((t, i) => (
              <Link to={t.href} key={i} className="group block">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col relative overflow-hidden">
                  <div className={`w-12 h-12 rounded-2xl ${t.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <t.icon className={cn("h-6 w-6", t.color)} />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{t.category}</p>
                  <h3 className="text-xl font-black text-[#0A0D14] mb-3">{t.title}</h3>
                  <p className="text-slate-400 font-medium text-[13px] leading-relaxed mb-8 flex-1">{t.desc}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 group-hover:mr-2 transition-all">Start Intake</span>
                    <ArrowRight className="h-3 w-3 text-emerald-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Team - Condensed Professional Profiles */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-b border-slate-100">
        <div className="text-center mb-16 space-y-2">
           <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">Clinical Leadership</span>
           <h2 className="text-4xl font-black tracking-tight text-[#0A0D14]">Board-certified oversight.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { name: "Dr. Michael Wasef, MD", title: "Internal Medicine Physician", desc: "Expertise in metabolic health and longitudinal telemedicine protocols." },
            { name: "Dr. Andrew Sakla, DO", title: "Internal Medicine Physician", desc: "Specialist in preventative care and advanced clinical intake auditing." }
          ].map((doc, i) => (
            <div key={i} className="flex gap-8 p-8 rounded-[40px] bg-white border border-slate-100 items-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 shrink-0 flex items-center justify-center text-slate-300 font-serif italic text-3xl">
                {doc.name.charAt(4)}
              </div>
              <div>
                <h4 className="text-lg font-black text-[#0A0D14] mb-0.5">{doc.name}</h4>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">{doc.title}</p>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{doc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Patient Reviews - Elegant & Proof-Focused */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12 items-center">
           <div className="space-y-6">
              <div className="flex gap-0.5 text-emerald-600">
                 {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <h2 className="text-4xl font-black tracking-tight text-[#0A0D14] leading-tight">Elite Patient Experience.</h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                 Discover why Peak Health is the preferred destination for biological optimization.
              </p>
           </div>
           <div className="lg:col-span-2 space-y-4">
              {[
                { quote: "Seamless clinical intake and rapid fulfillment. The standard of care is truly executive.", author: "Gretchen" },
                { quote: "Finally, a telehealth platform that prioritizes precision and patient privacy equally.", author: "Diana" }
              ].map((r, i) => (
                <div key={i} className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                   <p className="text-slate-700 font-medium text-lg leading-relaxed mb-4">"{r.quote}"</p>
                   <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-[11px] font-black text-[#0A0D14] uppercase tracking-[0.2em]">{r.author} • Verified Patient</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* FAQ - High Density Accordion */}
      <section className="py-20 bg-[#F8FAF9] px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black tracking-tight text-center text-[#0A0D14] mb-12">Platform FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden hover:border-emerald-200 transition-colors">
                <button 
                  className="w-full px-8 py-5 flex items-center justify-between text-left font-black text-sm uppercase tracking-wide text-[#0A0D14] focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="px-8 pb-6 pt-0 text-slate-500 text-sm font-medium leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
