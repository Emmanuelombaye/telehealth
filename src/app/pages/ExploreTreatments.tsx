import { motion } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, Zap, 
  Activity, Star, Clock, Heart, FlaskConical,
  Sparkles, Pill, Layout, CheckCircle2
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../components/ui/shared.tsx";
import { Reveal } from "../components/ui/Reveal";

const categories = [
  {
    title: "Weight Management",
    desc: "A weekly injection designed to support weight management by helping regulate appetite and reduce hunger signals, formulated with pharmaceutical-grade GLP-1–based active ingredients.",
    items: [
      { name: "Personalized Semaglutide+", price: "$199", tag: "Most Popular" },
      { name: "Personalized Tirzepatide+", price: "$329", tag: "Highest Efficacy" }
    ],
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Longevity",
    desc: "A therapy designed to support cellular energy, focus, metabolism, and healthy aging through replenishment of NAD+ levels.",
    items: [
      { name: "NAD+ Therapy", price: "$249", tag: "Cellular Health" }
    ],
    image: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Muscle Recovery",
    desc: "A daily peptide injection designed to support natural growth hormone production, energy, sleep quality, and recovery.",
    items: [
      { name: "Sermorelin Protocol", price: "$289", tag: "Peak Performance" }
    ],
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
  }
];

export function ExploreTreatmentsPage() {
  return (
    <div className="bg-white text-[#0A0D14] pt-24 min-h-screen">
      {/* Header */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <Reveal>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
              Explore <span className="text-emerald-600 italic font-serif">Treatments</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto pt-4">
              Find your custom health plan by selecting a goal below. Clinically backed, physician prescribed.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          {categories.map((cat, idx) => (
            <div key={idx} className={cn(
              "flex flex-col gap-12 items-center",
              idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
            )}>
              <div className="lg:w-1/2 space-y-8">
                <Reveal direction={idx % 2 === 1 ? "left" : "right"}>
                  <div className="space-y-6">
                    <h2 className="text-4xl md:text-5xl font-black">{cat.title}</h2>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed">{cat.desc}</p>
                    
                    <div className="space-y-4 pt-4">
                      {cat.items.map((item, i) => (
                        <Card key={i} className="border-2 border-slate-50 hover:border-emerald-500 transition-all rounded-[32px] p-6 group">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">{item.tag}</Badge>
                              <h3 className="text-xl font-black">{item.name}</h3>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-[#0A0D14]">{item.price}<span className="text-sm text-slate-400">/mo</span></p>
                              <Link to="/patient/shop" className="text-emerald-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-end gap-1 group-hover:gap-2 transition-all">
                                See if I qualify <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="pt-8">
                      <Link to="/patient/shop">
                        <Button className="h-16 px-10 rounded-2xl bg-[#0A0D14] text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-900/20 group">
                          Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Reveal>
              </div>

              <div className="lg:w-1/2 relative">
                <Reveal direction="up" delay={0.2}>
                  <div className="relative">
                    <div className="absolute -inset-6 bg-emerald-500/5 rounded-[64px] blur-3xl" />
                    <img 
                      src={cat.image} 
                      alt={cat.title} 
                      className="relative rounded-[64px] shadow-2xl z-10 w-full aspect-[4/3] object-cover"
                    />
                  </div>
                </Reveal>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-24 bg-[#0A0D14] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <Reveal>
            <h2 className="text-4xl font-black">Patients trust Peak Health.</h2>
            <div className="flex flex-wrap justify-center gap-12 pt-8 opacity-50">
              <span className="text-xl font-black uppercase tracking-[0.3em]">LegitScript</span>
              <span className="text-xl font-black uppercase tracking-[0.3em]">HIPAA Secure</span>
              <span className="text-xl font-black uppercase tracking-[0.3em]">FDA Registered</span>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
