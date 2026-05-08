import { motion } from "framer-motion";
import { 
  Beaker, Microscope, BookOpen, GraduationCap, 
  ArrowRight, ShieldCheck, CheckCircle2, FlaskConical,
  BarChart3, FileText, Globe, Heart, Lock
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../../components/ui/shared.tsx";
import { Reveal } from "../../components/ui/Reveal";

export function ClinicalResearchPage() {
  return (
    <div className="bg-white text-[#0A0D14] pt-24">
      {/* 1. Hero */}
      <section className="py-20 px-6 border-b border-slate-50">
        <div className="max-w-7xl mx-auto text-center space-y-8">
           <Reveal direction="up">
              <Badge className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border-emerald-100 uppercase tracking-widest font-black text-[10px]">
                Clinical Authority & Data
              </Badge>
           </Reveal>
           <Reveal direction="up" delay={0.3}>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                Evidence-based care <br/><span className="text-emerald-600">without exception.</span>
              </h1>
           </Reveal>
           <Reveal direction="up" delay={0.4}>
              <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium">
                Peak Health protocols are built on decades of peer-reviewed clinical data. We believe in transparency and medical rigor at every step of your journey.
              </p>
           </Reveal>
        </div>
      </section>

      {/* 2. Key Studies Grid */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto space-y-16">
           <div className="grid md:grid-cols-2 gap-12">
              <Reveal direction="right">
                 <div className="space-y-6">
                    <h2 className="text-4xl font-black">GLP-1 Weight Loss <br/>Metabolism Research</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                       Our Semaglutide and Tirzepatide programs are based on the landmark STEP and SURMOUNT clinical trials, which demonstrated unprecedented efficacy in weight management.
                    </p>
                    <div className="space-y-4">
                       {[
                         { t: "15% Average Weight Loss", d: "Results seen in 68-week clinical trials with once-weekly Semaglutide." },
                         { t: "Metabolic Markers", d: "Significant improvements in HbA1c, blood pressure, and cholesterol levels." },
                         { t: "Sustained Results", d: "Long-term data supports the safety and efficacy of multi-year GLP-1 protocols." }
                       ].map((item, i) => (
                         <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                               <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="font-black text-sm">{item.t}</p>
                               <p className="text-xs text-slate-400 font-medium">{item.d}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </Reveal>

              <Reveal direction="left">
                 <div className="space-y-6">
                    <h2 className="text-4xl font-black">NAD+ & Peptide <br/>Cellular Longevity</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                       Advanced research into Nicotinamide Adenine Dinucleotide (NAD+) and Growth Hormone Secretagogues (Peptides) highlights their role in DNA repair and cellular energy.
                    </p>
                    <div className="space-y-4">
                       {[
                         { t: "Mitochondrial Support", d: "NAD+ levels decline with age; replenishment supports ATP production and cellular repair." },
                         { t: "Cognitive Longevity", d: "Early data suggests neuroprotective benefits of NAD+ in neuro-aging models." },
                         { t: "Peptide Efficacy", d: "Sermorelin is clinically proven to stimulate pituitary release of growth hormone." }
                       ].map((item, i) => (
                         <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                               <Microscope className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="font-black text-sm">{item.t}</p>
                               <p className="text-xs text-slate-400 font-medium">{item.d}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </Reveal>
           </div>
        </div>
      </section>

      {/* 3. Global Citations Table (Expert Data) */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
           <div className="flex justify-between items-end">
              <div className="space-y-4">
                 <h2 className="text-4xl font-black">Research Directory</h2>
                 <p className="text-slate-500 font-medium">Independent studies and clinical publications.</p>
              </div>
              <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                 <Globe className="h-4 w-4" /> Global Database
              </Button>
           </div>

           <div className="overflow-hidden border border-slate-100 rounded-[32px] shadow-xl shadow-slate-200/50">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Study Name</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Publication</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Key Finding</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Reference</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {[
                      { s: "STEP 1 Clinical Trial", p: "New England Journal of Medicine", f: "14.9% mean weight loss at week 68", r: "NEJM 2021" },
                      { s: "SURMOUNT-1 Trial", p: "The Lancet", f: "Up to 22.5% body weight reduction", r: "Lancet 2022" },
                      { s: "NAD+ Metabolism in Aging", p: "Science Direct", f: "NAD+ precursors reverse mitochondrial decay", r: "Science 2013" },
                      { s: "Sermorelin GH Response", p: "J. Clin. Endocrinol. Metab", f: "Physiological GH pulse restoration", r: "JCEM 1999" },
                      { s: "PDE5i Safety Review", p: "American Journal of Cardiology", f: "Sildenafil efficacy in cardiovascular health", r: "AJC 2005" }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors group">
                         <td className="px-8 py-6 font-black text-sm text-[#0A0D14]">{row.s}</td>
                         <td className="px-8 py-6 text-xs text-slate-500 font-bold">{row.p}</td>
                         <td className="px-8 py-6 text-xs text-slate-400 font-medium">{row.f}</td>
                         <td className="px-8 py-6 text-right">
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 rounded-lg group-hover:translate-x-1 transition-transform">
                               <ArrowRight className="h-4 w-4" />
                            </Button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </section>

      {/* 4. Compliance & Trust */}
      <section className="py-24 px-6 bg-slate-50">
         <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "FDA Approved", desc: "We only prescribe FDA-approved medications and ingredients." },
              { icon: Lock, title: "HIPAA Secure", desc: "Your clinical data is protected by military-grade encryption." },
              { icon: Beaker, title: "Vetted Partners", desc: "Our 503(B) pharmacy partners maintain rigorous sterility." }
            ].map((item: any, i) => (
              <Reveal key={i} delay={0.1 * i} direction="up">
                 <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                       <item.icon className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h4 className="font-black text-lg">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                 </div>
              </Reveal>
            ))}
         </div>
      </section>

      {/* 5. Call to Action */}
      <section className="py-24 px-6 bg-white">
        <Reveal>
          <div className="max-w-5xl mx-auto bg-emerald-600 rounded-[64px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.2),transparent)]" />
             <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">Your health. <br/>Validated by science.</h2>
                <Link to="/patient/shop" className="inline-block">
                  <Button className="h-16 px-12 rounded-3xl bg-white text-emerald-600 font-black uppercase text-sm tracking-widest hover:scale-105 transition-transform">
                    Start Your Science-Backed Journey
                  </Button>
                </Link>
             </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
