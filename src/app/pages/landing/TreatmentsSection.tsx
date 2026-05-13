import { useState } from "react";
import { Link } from "react-router";

const tabs = ["Weight Loss","Longevity","Muscle Recovery","Hair Loss"];
const treatments: Record<string, { name:string; price:string; tag:string; tagColor:string; tagBg:string; desc:string; badge:string }> = {
  "Weight Loss": [
    { name:"Semaglutide+", price:"From $146/mo", tag:"GLP-1", tagColor:"text-violet-600", tagBg:"bg-violet-100", desc:"Weekly injection protocol. Clinically proven appetite suppression and metabolic optimization.", badge:"Most Popular" },
    { name:"Tirzepatide+", price:"From $189/mo", tag:"Dual GIP/GLP-1", tagColor:"text-blue-600", tagBg:"bg-blue-100", desc:"Dual-action receptor agonist. Superior weight loss outcomes with improved insulin sensitivity.", badge:"Best Results" },
  ],
  "Longevity": [
    { name:"NAD+ Therapy", price:"From $149/mo", tag:"Anti-Aging", tagColor:"text-emerald-600", tagBg:"bg-emerald-100", desc:"Replenish cellular NAD+ levels for improved energy, cognition, and DNA repair.", badge:"" },
    { name:"Sermorelin", price:"From $129/mo", tag:"Peptide", tagColor:"text-sky-600", tagBg:"bg-sky-100", desc:"Growth hormone secretagogue supporting recovery, lean mass, and sleep quality.", badge:"" },
  ],
  "Muscle Recovery": [
    { name:"BPC-157", price:"From $119/mo", tag:"Peptide", tagColor:"text-orange-600", tagBg:"bg-orange-100", desc:"Advanced tissue repair peptide for injury recovery, joint health, and inflammation reduction.", badge:"" },
    { name:"CJC-1295", price:"From $139/mo", tag:"Peptide", tagColor:"text-violet-600", tagBg:"bg-violet-100", desc:"Sustained growth hormone release for muscle growth, fat loss, and deep sleep restoration.", badge:"" },
  ],
  "Hair Loss": [
    { name:"Finasteride+", price:"From $49/mo", tag:"DHT Blocker", tagColor:"text-red-600", tagBg:"bg-red-100", desc:"Clinically proven to halt male pattern hair loss and promote regrowth.", badge:"" },
    { name:"Minoxidil Topical", price:"From $39/mo", tag:"Vasodilator", tagColor:"text-emerald-600", tagBg:"bg-emerald-100", desc:"Prescription-grade topical treatment for scalp blood flow and follicle stimulation.", badge:"" },
  ],
};

export function TreatmentsSection() {
  const [active, setActive] = useState("Weight Loss");
  const cards = treatments[active] ?? [];
  return (
    <section className="py-20 px-6 bg-[#f7f9fc]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-blue-500 block mb-2">Available Treatments</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0a0d14] tracking-tight m-0">Choose your protocol.</h2>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 justify-center flex-wrap mb-10">
          {tabs.map(t => (
            <button key={t} onClick={() => setActive(t)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer border-2 transition-all ${
                active === t 
                  ? "bg-[#0d2137] text-white border-[#0d2137]" 
                  : "bg-white text-[#0a0d14] border-slate-200 hover:border-slate-300"
              }`}>
              {t}
            </button>
          ))}
        </div>
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {cards.map((c,i) => (
            <div key={i} className="bg-white rounded-[32px] p-6 md:p-8 border border-[#e8edf3] shadow-sm relative overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
              {c.badge && <span className="absolute top-6 right-6 bg-amber-100 text-amber-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest z-10">{c.badge}</span>}
              
              {/* Product Image Placeholder (Vials) */}
              <div className="relative h-48 mb-6 rounded-2xl bg-[#f8fafc] overflow-hidden flex items-center justify-center">
                <img 
                  src="/generatedImages/image1-1.png" 
                  alt={c.name} 
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
              </div>

              <div className="mb-4">
                <span className={`${c.tagBg} ${c.tagColor} text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider`}>{c.tag}</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-black text-[#0a0d14] mb-2">{c.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">{c.desc}</p>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto border-t border-slate-100 pt-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Starting at</span>
                  <span className="font-black text-xl text-[#0d2137]">{c.price}</span>
                </div>
                <Link to="/quiz/select-treatment" className="text-center bg-[#0d2137] text-white py-3 px-6 rounded-full font-bold text-sm hover:bg-slate-900 transition-all shadow-lg shadow-blue-900/10">
                  Select Protocol →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
