import { useParams, Link } from "react-router";
import { motion } from "framer-motion";
import { 
  Zap, Brain, Microscope, Wind, ArrowRight, CheckCircle2, 
  ShieldCheck, Star, Activity, Sparkles, Rocket, Info, ChevronRight,
  FlaskConical, HeartPulse, ZapIcon, Target, Battery
} from "lucide-react";
import { Button, Card, cn } from "../../components/ui/shared";
import { Reveal } from "../../components/ui/Reveal";

const BIO_DATA: Record<string, any> = {
  "nad-plus": {
    title: "NAD+ Longevity Protocol",
    subtitle: "Cellular Energy & DNA Repair",
    heroText: "Replenish your body's essential coenzyme to reverse cellular aging and fuel performance.",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    accent: "yellow",
    image: "https://images.unsplash.com/photo-1532187863486-abf9d39d99f5?auto=format&fit=crop&w=1200&q=80",
    benefits: [
      { title: "Mitochondrial Support", desc: "Boosts ATP production for sustained daily energy." },
      { title: "Neuro-Protection", desc: "Supports cognitive function and neural longevity." },
      { title: "DNA Maintenance", desc: "Assists in cellular repair and genomic stability." }
    ],
    features: ["Pharmaceutical Grade", "High Bioavailability", "Clinical Strength"]
  },
  "nootropics": {
    title: "Cognitive Elite Protocol",
    subtitle: "Precision Neuro-Optimization",
    heroText: "Unlock peak mental clarity and focus with our scientifically formulated cognitive enhancers.",
    icon: Brain,
    color: "text-purple-600",
    bg: "bg-purple-50",
    accent: "purple",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80",
    benefits: [
      { title: "Executive Focus", desc: "Enhances concentration for high-pressure environments." },
      { title: "Memory Recall", desc: "Supports rapid information retrieval and retention." },
      { title: "Mental Resilience", desc: "Reduces brain fog and supports stress management." }
    ],
    features: ["No-Jitter Formula", "Sustainable Focus", "Neuro-Safe"]
  },
  "peptides": {
    title: "Regenerative Peptide Protocol",
    subtitle: "Tissue Repair & Performance",
    heroText: "Advanced biological signaling to accelerate recovery and optimize body composition.",
    icon: Microscope,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    accent: "emerald",
    image: "https://images.unsplash.com/photo-1579154273821-ad991fb9a56a?auto=format&fit=crop&w=1200&q=80",
    benefits: [
      { title: "Rapid Recovery", desc: "Accelerates tissue and joint repair after exertion." },
      { title: "GH Optimization", desc: "Stimulates natural growth hormone production." },
      { title: "Lean Mass Support", desc: "Assists in metabolic efficiency and muscle tone." }
    ],
    features: ["Custom Protocols", "Refrigerated Shipping", "Lab Verified"]
  },
  "hormones": {
    title: "Vitality BHRT Protocol",
    subtitle: "Precision Hormone Optimization",
    heroText: "Balance your biological foundation for enhanced energy, mood, and physical vitality.",
    icon: Wind,
    color: "text-blue-600",
    bg: "bg-blue-50",
    accent: "blue",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    benefits: [
      { title: "Metabolic Balance", desc: "Optimizes fat metabolism and energy distribution." },
      { title: "Mood Elevation", desc: "Supports emotional stability and mental wellbeing." },
      { title: "Vitality Boost", desc: "Enhances physical drive and overall life quality." }
    ],
    features: ["Physician Monitored", "Bio-Identical", "Safety First"]
  }
};

export function BioOptimizerPage() {
  const { slug } = useParams();
  const data = slug ? BIO_DATA[slug] : null;

  if (!data && slug) return <div className="min-h-screen flex items-center justify-center">Protocol Not Found</div>;

  return (
    <div className="bg-white min-h-screen pt-20">
      {/* Dynamic Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full blur-[120px] -z-10 opacity-30", `bg-${data?.accent || 'emerald'}-100`)} />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2 space-y-8">
            <Reveal>
              <div className="flex items-center gap-3">
                 <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", data?.bg || 'bg-emerald-50')}>
                    {data ? <data.icon className={cn("h-5 w-5", data.color)} /> : <Activity className="h-5 w-5 text-emerald-600" />}
                 </div>
                 <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", data?.color || 'text-emerald-600')}>
                    {data?.subtitle || "Biological Optimization Hub"}
                 </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-[#0A2E1F] mt-4">
                {data?.title || "Optimize your body's foundation."}
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                {data?.heroText || "Access professional-grade biological optimization protocols designed for longevity and performance."}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                 <Link to="/quiz/select-treatment">
                   <Button className="h-16 px-10 rounded-2xl bg-[#0A2E1F] text-white font-black uppercase text-xs tracking-widest hover:bg-emerald-950 shadow-2xl shadow-emerald-900/10">
                      Start Consultation
                   </Button>
                 </Link>
                 <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Board-Certified Oversight</span>
                 </div>
              </div>
            </Reveal>
          </div>
          
          <div className="lg:w-1/2 relative">
             <Reveal direction="up">
                <div className="relative group">
                   <div className={cn("absolute -inset-4 rounded-[48px] blur-2xl opacity-20", `bg-${data?.accent || 'emerald'}-400`)} />
                   <img 
                     src={data?.image || "https://images.unsplash.com/photo-1559839734-2b71f1e3c77d?auto=format&fit=crop&w=1200&q=80"} 
                     alt="Optimization" 
                     className="relative rounded-[40px] shadow-2xl border-8 border-white object-cover h-[500px] w-full"
                   />
                </div>
             </Reveal>
          </div>
        </div>
      </section>

      {/* Grid of All Protocols if no slug */}
      {!slug && (
        <section className="py-24 px-6 bg-[#F8FAF9]">
           <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16 space-y-4">
                 <h2 className="text-4xl font-black tracking-tight text-[#0A2E1F]">The Bio-Optimizer Ecosystem</h2>
                 <p className="text-lg text-slate-500 font-medium">Select a biological domain to explore custom-engineered protocols.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {Object.entries(BIO_DATA).map(([key, item]: [string, any]) => (
                   <Link to={`/bio/${key}`} key={key} className="group">
                     <Card className="p-8 rounded-[32px] bg-white border-slate-100 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 h-full flex flex-col">
                        <div className={cn("h-12 w-12 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform", item.bg)}>
                           <item.icon className={cn("h-6 w-6", item.color)} />
                        </div>
                        <h3 className="text-xl font-black text-[#0A0D14] mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6 flex-1">{item.heroText}</p>
                        <div className="flex items-center gap-2 mt-auto">
                           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">View Protocol</span>
                           <ArrowRight size={14} className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                     </Card>
                   </Link>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* Benefits Section for Slug */}
      {data && (
        <section className="py-24 px-6 bg-[#F8FAF9]">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-12">
            {data.benefits.map((benefit: any, i: number) => (
              <div key={i} className="p-10 rounded-[40px] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className={cn("h-12 w-12 rounded-2xl mb-8 flex items-center justify-center group-hover:rotate-12 transition-transform", data.bg)}>
                   <CheckCircle2 className={cn("h-6 w-6", data.color)} />
                </div>
                <h3 className="text-2xl font-black text-[#0A0D14] mb-4">{benefit.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Value Props Strip */}
      <section className="py-12 border-y border-slate-100 bg-white px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-12 md:gap-24">
           {[
             { icon: FlaskConical, text: "Pharmaceutical Grade" },
             { icon: HeartPulse, text: "Clinical Monitoring" },
             { icon: Sparkles, text: "Personalized Dosage" },
             { icon: Target, text: "Precision Delivery" }
           ].map((item, i) => (
             <div key={i} className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-emerald-600" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{item.text}</span>
             </div>
           ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center">
         <Reveal>
            <div className="max-w-3xl mx-auto space-y-8">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                  <Star className="h-3 w-3 fill-current" /> Platinum Standard Care
               </div>
               <h2 className="text-5xl font-black tracking-tight text-[#0A2E1F]">Invest in your future self.</h2>
               <p className="text-xl text-slate-500 font-medium">Our physicians are ready to help you optimize your health foundation.</p>
               <Link to="/quiz/select-treatment">
                 <Button className="h-16 px-12 rounded-2xl bg-[#0A2E1F] text-white font-black uppercase text-xs tracking-widest hover:bg-emerald-950 shadow-2xl shadow-emerald-900/10">
                    Get Started Now
                 </Button>
               </Link>
            </div>
         </Reveal>
      </section>
    </div>
  );
}
