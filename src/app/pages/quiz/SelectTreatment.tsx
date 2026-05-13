import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, ShieldCheck, Activity, HeartPulse } from "lucide-react";
import { Button } from "../../components/ui/shared";
import { cn } from "../../components/ui/utils";

const treatments = [
  {
    id: "weight-loss",
    category: "Weight Management",
    title: "Weight Loss Protocol",
    desc: "Clinically proven GLP-1 medications (Semaglutide or Tirzepatide) to regulate appetite and metabolism.",
    icon: <Activity className="h-6 w-6 text-emerald-500" />,
    badge: "Most Popular",
    badgeColor: "bg-emerald-100 text-emerald-700",
    price: "As low as $146/mo",
    color: "emerald",
  },
  {
    id: "longevity",
    category: "Anti-Aging & Focus",
    title: "NAD+ Longevity",
    desc: "Replenish cellular energy to support metabolism, cognitive focus, and healthy aging.",
    icon: <Star className="h-6 w-6 text-blue-500" />,
    badge: "Trending",
    badgeColor: "bg-blue-100 text-blue-700",
    price: "From $199/mo",
    color: "blue",
  },
  {
    id: "muscle",
    category: "Performance & Recovery",
    title: "Sermorelin Peptide",
    desc: "Support natural growth hormone production for better sleep, energy, and muscle recovery.",
    icon: <HeartPulse className="h-6 w-6 text-indigo-500" />,
    badge: "New",
    badgeColor: "bg-indigo-100 text-indigo-700",
    price: "From $249/mo",
    color: "indigo",
  }
];

export function SelectTreatmentPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedId) {
      navigate(`/quiz/${selectedId}/reviews`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-slate-900 pt-10 pb-24">
      {/* Header and Trust Banner */}
      <div className="max-w-3xl mx-auto px-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm w-fit">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="flex items-center justify-center gap-3 bg-white py-3 px-6 rounded-full border border-slate-100 shadow-sm w-fit">
          <div className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <p className="text-sm font-bold text-slate-700">
            Trustpilot Excellent <span className="text-slate-400 font-medium">(10,000+)</span>
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="h-1 flex-1 bg-emerald-600 rounded-full" />
          <div className="h-1 flex-1 bg-slate-200 rounded-full" />
          <div className="h-1 flex-1 bg-slate-200 rounded-full" />
        </div>
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
          Step 1 of 3 • Selection
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0A0D14] mb-4">
            What is your primary <span className="font-serif italic text-emerald-600 font-medium">goal?</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Select an area of focus to see personalized clinical options and real patient results.
          </p>
        </motion.div>

        <div className="space-y-4 mb-12">
          {treatments.map((t, i) => {
            const isSelected = selectedId === t.id;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "relative bg-white rounded-[24px] p-6 md:p-8 cursor-pointer transition-all duration-300 border-2",
                  isSelected 
                    ? `border-${t.color}-500 shadow-xl shadow-${t.color}-500/10 scale-[1.02]` 
                    : "border-transparent hover:border-slate-200 hover:shadow-md shadow-sm"
                )}
              >
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? `bg-${t.color}-50` : "bg-slate-50"
                  )}>
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {t.category}
                      </p>
                      {t.badge && (
                        <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full", t.badgeColor)}>
                          {t.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-[#0A0D14] mb-2">{t.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-4">{t.desc}</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-600">{t.price}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center justify-center">
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected ? `border-${t.color}-500 bg-${t.color}-500` : "border-slate-300 bg-white"
                    )}>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Floating CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent pointer-events-none z-40">
          <div className="max-w-3xl mx-auto flex justify-center pointer-events-auto">
            <motion.div
              initial={false}
              animate={{ 
                y: selectedId ? 0 : 100, 
                opacity: selectedId ? 1 : 0 
              }}
              className="w-full"
            >
              <Button 
                onClick={handleContinue}
                className="w-full h-16 rounded-full bg-[#0A0D14] text-white hover:bg-slate-800 font-bold text-lg shadow-2xl shadow-slate-900/20 group"
              >
                Continue to Reviews
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
