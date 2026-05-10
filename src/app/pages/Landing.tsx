import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronDown, Star } from "lucide-react";
import { Button, cn } from "../components/ui/shared.tsx";

const treatments = [
  {
    category: "Weight Management",
    title: "Personalized Semaglutide+",
    desc: "A weekly injection designed to support weight management by helping regulate appetite and reduce hunger signals.",
    href: "/quiz/select-treatment",
    bg: "bg-emerald-50",
  },
  {
    category: "Weight Management",
    title: "Personalized Tirzepatide+",
    desc: "A dual-action weekly injection targeting multiple receptors to support significant weight loss and metabolic health.",
    href: "/quiz/select-treatment",
    bg: "bg-teal-50",
  },
  {
    category: "Anti-Aging & Focus",
    title: "NAD+ Longevity",
    desc: "A therapy designed to support cellular energy, focus, metabolism, and healthy aging through replenishment of NAD+ levels.",
    href: "/quiz/select-treatment",
    bg: "bg-blue-50",
  },
  {
    category: "Performance",
    title: "Sermorelin Muscle Recovery",
    desc: "A daily peptide injection designed to support natural growth hormone production, energy, sleep quality, and recovery.",
    href: "/quiz/select-treatment",
    bg: "bg-indigo-50",
  }
];

const faqs = [
  {
    q: "What is Peak Health?",
    a: "Peak Health is a telehealth platform connecting patients with licensed providers and pharmacies for personalized, compounded treatments. We support patients across various health needs with tailored, science-backed care."
  },
  {
    q: "Who is eligible for treatment?",
    a: "Eligibility depends on the specific treatment protocol. For weight management, you may qualify if your BMI is 30+, or 27+ with a weight-related condition. A licensed provider will review your medical history to determine appropriateness."
  },
  {
    q: "How does Peak Health work?",
    a: "Complete your intake online. A provider reviews it within 24 hours. If approved, your medication is compounded by a licensed pharmacy and shipped to your home via expedited delivery."
  },
  {
    q: "Are these medications FDA-approved?",
    a: "Peak Health provides compounded medications prepared by licensed U.S. pharmacies operating under strict state and federal oversight. While compounded medications are not FDA-approved, our pharmacy partners are fully licensed and held to rigorous standards."
  }
];

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-white font-sans text-slate-900 selection:bg-emerald-100">
      
      {/* Hero Section */}
      <section className="pt-20 pb-24 md:pt-32 md:pb-40 px-6 text-center max-w-4xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          <span className="text-emerald-600 font-bold tracking-widest text-sm uppercase">designed around you.</span>
          <h1 className="mt-4 text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] text-[#0A0D14]">
            Treatment that <span className="text-emerald-600 font-serif italic font-medium">works.</span>
          </h1>
          <p className="mt-6 text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Discover Peak Health's proven, science-backed programs. Personalized care, transparent pricing, and expert support to help you achieve lasting results.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link to="/quiz/select-treatment">
            <Button className="h-14 px-10 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 group">
              See if I qualify
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/explore-treatments">
            <Button variant="outline" className="h-14 px-10 rounded-full border-2 border-slate-200 text-slate-700 font-bold text-sm tracking-wide hover:bg-slate-50">
              Explore Treatments
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Trustpilot / Results Strip */}
      <section className="border-y border-slate-100 bg-[#F8FAF9] py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center font-bold text-slate-900 text-xl mb-10">Our patients' results speak for themselves!</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { name: "Lisa C.", lost: "75 lbs", time: "10 Months" },
              { name: "Blaze B.", lost: "50 lbs", time: "6 Months" },
              { name: "Crystal G.", lost: "50 lbs", time: "6 Months" },
              { name: "Jamilyn C.", lost: "17 lbs", time: "6 Weeks" },
            ].map((res, i) => (
              <div key={i} className="text-center space-y-1">
                <p className="text-2xl font-black text-emerald-600">-{res.lost}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">in {res.time}</p>
                <p className="text-[10px] font-bold text-slate-400">{res.name} • Verified</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto text-center" id="how-it-works">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#0A0D14] mb-4">How it works</h2>
        <p className="text-lg text-slate-500 font-medium mb-16 max-w-2xl mx-auto">
          From onboarding through treatment, we'll be supporting and guiding you every step of the way.
        </p>

        <div className="grid md:grid-cols-3 gap-12 relative text-left">
          <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-px bg-slate-200 -z-10" />
          {[
            { step: "1", title: "Choose a treatment plan & checkout", desc: "Complete a short questionnaire to confirm your eligibility for treatment and authorize your payment." },
            { step: "2", title: "Provider review", desc: "After verifying your identity, a licensed U.S. provider reviews your intake within 24 hours." },
            { step: "3", title: "Start treatment", desc: "If approved, your prescription is filled by a licensed U.S. pharmacy and delivered to your door with 2-day shipping." }
          ].map((s, i) => (
            <div key={i} className="relative bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
              <div className="absolute -top-6 left-8 h-12 w-12 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xl shadow-lg border-4 border-white">
                {s.step}
              </div>
              <h3 className="text-xl font-black text-[#0A0D14] mb-3 mt-4">{s.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop / Treatments */}
      <section className="py-24 bg-[#F8FAF9] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-black tracking-tight text-[#0A0D14] mb-4">Explore Treatments</h2>
            <p className="text-lg text-slate-500 font-medium">Find your custom health plan by selecting a goal below.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {treatments.map((t, i) => (
              <Link to={t.href} key={i} className="group block">
                <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className={`w-16 h-16 rounded-2xl ${t.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 opacity-80" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.category}</p>
                  <h3 className="text-2xl font-black text-[#0A0D14] mb-4">{t.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-1">{t.desc}</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <span className="text-sm font-bold text-emerald-600">See if I qualify</span>
                    <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Team */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-4xl font-black tracking-tight text-[#0A0D14] leading-tight">
              Expert care from <br/>trusted providers.
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Our network of licensed U.S. physicians ensures you receive the highest standard of personalized medical care.
            </p>
          </div>
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            {[
              { name: "Dr. Michael Wasef, MD", title: "Internal Medicine Physician", desc: "Licensed nationwide with clinical and administrative telemedicine expertise." },
              { name: "Dr. Andrew Sakla, DO", title: "Internal Medicine Physician", desc: "Evidence-based virtual care prioritizing accessibility and patient experience." }
            ].map((doc, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-100/50">
                <div className="h-16 w-16 rounded-full bg-slate-100 mb-6 flex items-center justify-center text-slate-400 font-serif italic text-2xl">
                  {doc.name.charAt(4)}
                </div>
                <h4 className="text-xl font-black text-[#0A0D14] mb-1">{doc.name}</h4>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">{doc.title}</p>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-[#0A0D14] text-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Transparent & Trusted", desc: "From ingredient sourcing to doorstep delivery, we prioritize pharmaceutical grade quality and complete transparency." },
              { title: "Tailored Personalized Care", desc: "We create tailored plans based on your health goals, ensuring the best path to your success." },
              { title: "Science-backed Results", desc: "Clinically guided care designed to support long-term health, performance, and overall wellbeing." }
            ].map((v, i) => (
              <div key={i} className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-2xl font-black">{v.title}</h4>
                <p className="text-slate-400 font-medium leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patient Reviews */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center gap-1 mb-6 text-amber-400">
            {[1,2,3,4,5].map(i => <Star key={i} className="h-6 w-6 fill-current" />)}
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#0A0D14]">
            Effective treatment is only part of the equation.
          </h2>
          <p className="text-xl text-slate-500 font-medium mt-6">
            What truly defines care is the support at every step of your journey.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "I only have good things to say about Peak Health. The approval process was easy and I received my order very quickly. The instructions were clear and support was super helpful!", author: "Gretchen" },
            { quote: "I'm very impressed with the fast and efficient service. Their communication and efficiency is unparalleled. I can't recommend this company enough! Excellent 5 stars!", author: "Diana" },
            { quote: "I absolutely love the great customer service and how fast I was provided with all the information to start my journey. I am so glad to be part of Peak Health.", author: "Laura G." }
          ].map((r, i) => (
            <div key={i} className="bg-[#F8FAF9] p-8 rounded-3xl">
              <p className="text-slate-700 font-medium leading-relaxed italic mb-6">"{r.quote}"</p>
              <p className="font-black text-[#0A0D14]">{r.author}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Patient</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#F8FAF9] px-6 border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black tracking-tight text-center text-[#0A0D14] mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button 
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-[#0A0D14] focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 pt-0 text-slate-500 font-medium leading-relaxed">
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
