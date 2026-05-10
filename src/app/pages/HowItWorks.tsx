import { motion } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, Zap, 
  Activity, Star, Clock, Heart, FlaskConical,
  Sparkles, Pill, Layout, CheckCircle2,
  Lock, Truck, MessageSquare
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../components/ui/shared.tsx";
import { Reveal } from "../components/ui/Reveal";

export function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Choose a treatment plan & checkout",
      desc: "Complete a short questionnaire to confirm your eligibility for treatment and authorize your payment. Your health data is encrypted and HIPAA-protected.",
      icon: Layout,
      color: "bg-emerald-500",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80"
    },
    {
      step: "02",
      title: "Provider review",
      desc: "After verifying your identity, a licensed U.S. provider reviews your intake within 24 hours to determine if treatment is appropriate for you.",
      icon: ShieldCheck,
      color: "bg-emerald-500",
      image: "https://images.unsplash.com/photo-1559839734-2b71f1e3c77d?auto=format&fit=crop&w=800&q=80"
    },
    {
      step: "03",
      title: "Start treatment",
      desc: "If approved, your prescription is filled by a licensed U.S. pharmacy and delivered to your door with free expedited 2-day shipping.",
      icon: Zap,
      color: "bg-emerald-500",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div className="bg-white text-[#0A0D14] pt-24 min-h-screen">
      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Reveal>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
              Healthcare <span className="text-emerald-600 italic font-serif">designed</span> around you.
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto pt-4">
              From onboarding through treatment, we'll be supporting and guiding you every step of the way.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Steps List */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto space-y-48">
          {steps.map((s, idx) => (
            <div key={idx} className={cn(
              "flex flex-col gap-16 items-center",
              idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
            )}>
              <div className="lg:w-1/2 space-y-8">
                <Reveal direction={idx % 2 === 1 ? "left" : "right"}>
                  <div className="space-y-6">
                    <span className="text-6xl font-black text-slate-100 italic">{s.step}</span>
                    <div className="h-16 w-16 rounded-[24px] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <s.icon className="h-8 w-8" />
                    </div>
                    <h2 className="text-4xl font-black leading-tight">{s.title}</h2>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                    
                    <ul className="space-y-4 pt-4">
                       <li className="flex items-center gap-3 font-bold text-sm">
                         <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% HIPAA Compliant
                       </li>
                       <li className="flex items-center gap-3 font-bold text-sm">
                         <CheckCircle2 className="h-4 w-4 text-emerald-500" /> U.S. Licensed Providers
                       </li>
                    </ul>
                  </div>
                </Reveal>
              </div>

              <div className="lg:w-1/2">
                <Reveal direction="up" delay={0.2}>
                   <div className="relative">
                      <div className="absolute inset-0 bg-emerald-100 rounded-[80px] rotate-3 scale-95" />
                      <img 
                        src={s.image} 
                        alt={s.title} 
                        className="relative rounded-[80px] shadow-2xl z-10 w-full h-[500px] object-cover"
                      />
                   </div>
                </Reveal>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Support Section */}
      <section className="py-32 bg-[#F8FAF9] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0A0D14] rounded-[64px] p-12 md:p-24 text-white relative overflow-hidden flex flex-col lg:flex-row items-center gap-16">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px]" />
            <div className="lg:w-1/2 space-y-8 relative z-10">
              <MessageSquare className="h-16 w-16 text-emerald-400" />
              <h2 className="text-5xl font-black leading-tight">We’re here for you at <span className="text-emerald-500 italic font-serif">every step.</span></h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed">
                Effective treatment is only part of the equation. What truly defines care is the support at every step of your journey.
              </p>
              <Button className="h-16 px-12 rounded-2xl bg-white text-[#0A0D14] font-black uppercase text-xs tracking-widest shadow-2xl shadow-black/20 hover:bg-emerald-50 transition-all">
                Message Support Team
              </Button>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4 relative z-10">
               {[
                 { label: "Onboarding Support", icon: Layout },
                 { label: "Provider Messaging", icon: MessageSquare },
                 { label: "Refill Management", icon: Clock },
                 { label: "Safety Monitoring", icon: ShieldCheck }
               ].map((item, i) => (
                 <Card key={i} className="bg-white/5 border-white/10 rounded-3xl p-6 flex flex-col items-center text-center gap-4">
                   <item.icon className="h-8 w-8 text-emerald-400" />
                   <p className="text-xs font-black uppercase tracking-widest leading-tight">{item.label}</p>
                 </Card>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white text-center px-6">
        <Reveal>
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-5xl font-black">Ready to get started?</h2>
            <p className="text-xl text-slate-500 font-medium">Join thousands of patients who have trusted Peak Health for their weight loss treatment.</p>
            <Link to="/patient/shop">
              <Button className="h-16 px-12 rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700">
                See if I qualify
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
