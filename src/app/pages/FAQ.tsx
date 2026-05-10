import { motion } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, HelpCircle, 
  Search, ChevronDown, MessageSquare
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../components/ui/shared.tsx";
import { Reveal } from "../components/ui/Reveal";

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is Peak Health?",
        a: "Peak Health is a telehealth platform connecting patients with licensed providers and pharmacies for personalized, compounded treatments. While we are best known for our GLP-1 weight management programs, we also support patients across other health needs with tailored, science-backed care."
      },
      {
        q: "How does Peak Health work?",
        a: "Complete your intake online → Provider review (within 24 hours) → If approved, your medication is compounded by a licensed pharmacy and shipped to your home via UPS 2-Day Air."
      }
    ]
  },
  {
    category: "Eligibility & Treatment",
    questions: [
      {
        q: "Who is eligible for treatment?",
        a: "You may qualify if your BMI is 30+, or 27+ with a weight-related condition (such as type 2 diabetes, high blood pressure, or high cholesterol). Patients with BMI above 25 may also qualify depending on medical history, as determined by a licensed provider."
      },
      {
        q: "Are these medications FDA-approved?",
        a: "Peak Health provides compounded medications prepared by licensed U.S. pharmacies operating under strict state and federal oversight. While compounded medications are not FDA-approved and have not undergone FDA review for safety, effectiveness, or manufacturing quality, our pharmacy partners are fully licensed and held to rigorous compounding standards."
      }
    ]
  },
  {
    category: "Pricing & Billing",
    questions: [
      {
        q: "How much does it cost?",
        a: "Pricing is shared after intake once eligibility is confirmed. Current offers are as low as $146/month for new Semaglutide patients (6-month plan) and $258/month for new Tirzepatide patients (6-month plan). Discounts may apply based on commitments and current promotions."
      },
      {
        q: "Is insurance accepted?",
        a: "We currently do not accept insurance. This allows us to provide transparent pricing and focus on high-quality personalized care without the administrative barriers of traditional insurance."
      }
    ]
  }
];

export function FrequentlyAskedQuestionsPage() {
  return (
    <div className="bg-white text-[#0A0D14] pt-24 min-h-screen">
      {/* Header */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Reveal>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
              Common <span className="text-emerald-600 italic font-serif">Questions</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto pt-4">
              Everything you need to know about our treatments, process, and platform.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ Search (Visual Only) */}
      <section className="px-6 mb-20">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search questions..." 
            className="w-full h-16 pl-16 pr-6 bg-slate-50 rounded-3xl border border-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </section>

      {/* FAQ List */}
      <section className="pb-32 px-6">
        <div className="max-w-4xl mx-auto space-y-20">
          {faqs.map((cat, idx) => (
            <div key={idx} className="space-y-8">
              <Reveal>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 border-b border-slate-100 pb-4">{cat.category}</h2>
              </Reveal>
              <div className="space-y-4">
                {cat.questions.map((faq, i) => (
                  <Reveal key={i} delay={0.1 * i} direction="up">
                    <Card className="border-2 border-slate-50 hover:border-emerald-500 transition-all rounded-[32px] group">
                      <CardContent className="p-8 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-xl font-black leading-tight group-hover:text-emerald-600 transition-colors">{faq.q}</h3>
                          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                          </div>
                        </div>
                        <p className="text-slate-500 font-medium leading-relaxed">{faq.a}</p>
                      </CardContent>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-24 bg-[#0A0D14] text-white px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <HelpCircle className="h-16 w-16 text-emerald-400 mx-auto" />
          <h2 className="text-4xl font-black">Still have questions?</h2>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            Our medical support team is ready to help you with anything you need.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button className="h-16 px-12 rounded-2xl bg-white text-[#0A0D14] font-black uppercase text-xs tracking-widest hover:bg-emerald-50 transition-all">
              Message Support
            </Button>
            <Button variant="outline" className="h-16 px-12 rounded-2xl border-2 border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/5 transition-all">
              Schedule a Call
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
