import { motion } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, Zap, 
  Activity, Star, Clock, Heart, FlaskConical,
  Sparkles, Pill, Layout, CheckCircle2,
  Lock, Truck, MessageSquare, Fingerprint, Shield, ZapIcon
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../components/ui/shared.tsx";
import { Reveal } from "../components/ui/Reveal";

export function HowItWorksPage() {
  const steps = [
    {
      step: "Protocol 01",
      title: "Secure Clinical Intake",
      desc: "Complete a precision-engineered questionnaire to establish your biological baseline. Your data is protected by enterprise-grade encryption and strict HIPAA protocols.",
      icon: Layout,
      color: "bg-emerald-600",
      accent: "text-emerald-600",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
      points: ["Encrypted Data Transmission", "Identity Verification", "HIPAA Protected"]
    },
    {
      step: "Protocol 02",
      title: "Board-Certified Provider Review",
      desc: "A licensed U.S. physician conducts a comprehensive review of your medical profile to determine the safest and most effective treatment protocol for your specific needs.",
      icon: ShieldCheck,
      color: "bg-[#0A2E1F]",
      accent: "text-emerald-500",
      image: "https://images.unsplash.com/photo-1559839734-2b71f1e3c77d?auto=format&fit=crop&w=800&q=80",
      points: ["100% U.S. Licensed Physicians", "24-Hour Clinical Turnaround", "Personalized Dosage Analysis"]
    },
    {
      step: "Protocol 03",
      title: "Pharmacy Fulfillment & Dispatch",
      desc: "Once authorized, your prescription is prepared by our partner U.S. licensed pharmacies and dispatched via refrigerated, expedited shipping directly to your residence.",
      icon: Zap,
      color: "bg-emerald-600",
      accent: "text-emerald-600",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      points: ["Cold-Chain Logistic Standards", "Discrete Premium Packaging", "Free Overnight Shipping"]
    }
  ];

  return (
    <div className="bg-white text-[#0A0D14] pt-24 min-h-screen">
      {/* Hero - More Compact and Executive */}
      <section className="py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-50/50 rounded-full blur-[100px] -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Reveal>
             <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] mb-4">The Peak Health Standard</span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
              A higher standard of <span className="text-emerald-600 italic font-serif">clinical</span> delivery.
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto pt-4 leading-relaxed">
              We've engineered a frictionless, secure path from clinical review to treatment delivery, ensuring zero compromise on safety or speed.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Steps List - Condensed and High Density */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto space-y-32">
          {steps.map((s, idx) => (
            <div key={idx} className={cn(
              "flex flex-col gap-12 lg:gap-20 items-center",
              idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
            )}>
              <div className="lg:w-[45%] space-y-6">
                <Reveal direction={idx % 2 === 1 ? "left" : "right"}>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white", s.color)}>
                          <s.icon className="h-4 w-4" />
                       </div>
                       <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">{s.step}</span>
                    </div>
                    
                    <h2 className="text-3xl font-black leading-tight tracking-tight">{s.title}</h2>
                    <p className="text-[17px] text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                       {s.points.map((pt, i) => (
                         <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">{pt}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </Reveal>
              </div>

              <div className="lg:w-[55%]">
                <Reveal direction="up" delay={0.2}>
                   <div className="relative group">
                      {/* Decorative Emerald Frame */}
                      <div className="absolute -inset-4 bg-emerald-50/50 rounded-[40px] group-hover:bg-emerald-100/50 transition-colors duration-500" />
                      <div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-emerald-900/10 border-8 border-white">
                        <img 
                          src={s.image} 
                          alt={s.title} 
                          className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-700"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent" />
                      </div>
                   </div>
                </Reveal>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Support Section - Condensed Layout */}
      <section className="py-24 bg-[#F8FAF9] px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#0A2E1F] rounded-[48px] p-8 md:p-16 text-white relative overflow-hidden flex flex-col lg:flex-row items-center gap-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 blur-[100px]" />
            <div className="lg:w-1/2 space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                 <Shield className="h-3 w-3" /> Peak Health Priority
              </div>
              <h2 className="text-4xl font-black leading-tight">We’re with you at <span className="text-emerald-400 italic font-serif">every step.</span></h2>
              <p className="text-lg text-emerald-100/60 font-medium leading-relaxed">
                Our clinical support team is active 24/7, monitoring your progress and ensuring your protocol remains optimized.
              </p>
              <Button className="h-14 px-10 rounded-2xl bg-white text-emerald-950 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-black/20 hover:bg-emerald-50 transition-all">
                Access Clinical Support
              </Button>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4 relative z-10">
               {[
                 { label: "Onboarding Support", icon: Layout },
                 { label: "Provider Messaging", icon: MessageSquare },
                 { label: "Refill Management", icon: Clock },
                 { label: "Safety Monitoring", icon: ShieldCheck }
               ].map((item, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center gap-3 backdrop-blur-sm">
                   <item.icon className="h-6 w-6 text-emerald-400" />
                   <p className="text-[10px] font-black uppercase tracking-widest leading-tight text-white/80">{item.label}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Information Dense */}
      <section className="py-24 bg-white text-center px-6">
        <Reveal>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-center gap-1 mb-2">
               {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 text-emerald-600 fill-current" />)}
            </div>
            <h2 className="text-4xl font-black tracking-tight text-[#0A2E1F]">Begin your clinical transformation.</h2>
            <p className="text-lg text-slate-500 font-medium">Join 15,000+ patients who have chosen Peak Health for biological optimization.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/patient/shop">
                <Button className="h-14 px-10 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all">
                  Start Consultation
                </Button>
              </Link>
              <Link to="/explore-treatments" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">
                View All Treatments
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
