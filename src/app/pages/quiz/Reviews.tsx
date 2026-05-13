import { useParams, Link } from "react-router";
import { motion } from "framer-motion";
import { Star, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/shared";
import { cn } from "../../components/ui/utils";

const reviewData = {
  "weight-loss": {
    title: "Weight Loss Protocol",
    headline: "Real people, real results.",
    subheadline: "See how the Peak Health GLP-1 protocol has transformed lives.",
    beforeAfter: {
      imagePlaceholderBg: "bg-emerald-100",
      beforeText: "Before",
      afterText: "Lost 45 lbs in 6 months",
      name: "Sarah M.",
      age: "42 years old",
      beforeImg: "/generatedImages/image1-7.png",
      afterImg: "/generatedImages/image1-8.png",
    },
    reviews: [
      { name: "Jessica T.", text: "This medication completely silenced my food noise. I've lost 30 pounds and feel like I have my life back.", stars: 5, time: "2 weeks ago" },
      { name: "Michael R.", text: "The process was so easy and the doctor was incredibly helpful. Down 50 lbs.", stars: 5, time: "1 month ago" },
      { name: "Amanda K.", text: "I tried everything before this. The Peak Health protocol actually works.", stars: 5, time: "2 months ago" }
    ],
    color: "emerald"
  },
  "longevity": {
    title: "NAD+ Longevity",
    headline: "Rewind your biological clock.",
    subheadline: "Patients report improved focus, energy, and overall vitality.",
    beforeAfter: {
      imagePlaceholderBg: "bg-blue-100",
      beforeText: "Fatigued & Brain Fog",
      afterText: "Sharp & Energized",
      name: "David L.",
      age: "55 years old",
      beforeImg: "/generatedImages/image1-5.png",
      afterImg: "/generatedImages/image1-6.png",
    },
    reviews: [
      { name: "Robert P.", text: "My afternoon brain fog is completely gone. I feel 10 years younger.", stars: 5, time: "3 weeks ago" },
      { name: "Elena S.", text: "The energy difference is night and day. Highly recommend the NAD+ protocol.", stars: 5, time: "1 month ago" },
      { name: "James W.", text: "Incredible results. My workouts and focus have both improved drastically.", stars: 5, time: "2 months ago" }
    ],
    color: "blue"
  },
  "muscle": {
    title: "Sermorelin Peptide",
    headline: "Optimize your recovery.",
    subheadline: "Experience deeper sleep and faster recovery times.",
    beforeAfter: {
      imagePlaceholderBg: "bg-indigo-100",
      beforeText: "Slow Recovery",
      afterText: "Lean Muscle & High Energy",
      name: "Chris B.",
      age: "38 years old",
      beforeImg: "/generatedImages/image1-9.png",
      afterImg: "/generatedImages/image1-10.png",
    },
    reviews: [
      { name: "Marcus J.", text: "My sleep quality has skyrocketed and my recovery time after heavy lifts is cut in half.", stars: 5, time: "1 week ago" },
      { name: "Alex T.", text: "I'm finally breaking through plateaus. The Sermorelin protocol is legit.", stars: 5, time: "3 weeks ago" },
      { name: "Sam D.", text: "Best decision I made for my fitness journey. Deep sleep and great energy.", stars: 5, time: "1 month ago" }
    ],
    color: "indigo"
  }
};

export function ReviewsPage() {
  const { condition } = useParams();
  const data = reviewData[(condition as keyof typeof reviewData) || "weight-loss"];

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-slate-900 pt-10 pb-32">
      {/* Header and Progress */}
      <div className="max-w-3xl mx-auto px-6 mb-12">
        <div className="mb-6">
          <Link to="/quiz/select-treatment" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm w-fit">
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 flex-1 bg-emerald-600 rounded-full" />
          <div className="h-1 flex-1 bg-emerald-600 rounded-full" />
          <div className="h-1 flex-1 bg-slate-200 rounded-full" />
        </div>
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
          Step 2 of 3 • Results
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className={cn(`text-${data.color}-600 font-bold tracking-widest text-sm uppercase mb-4 block`)}>
            {data.title}
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#0A0D14] mb-4">
            {data.headline}
          </h1>
          <p className="text-xl text-slate-500 font-medium">
            {data.subheadline}
          </p>
        </motion.div>

        {/* Dynamic Before/After Display */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-[32px] p-4 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 mb-16"
        >
          <div className="grid md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-100 group">
              {data.beforeAfter.beforeImg ? (
                <img src={data.beforeAfter.beforeImg} alt="Before" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black text-2xl uppercase tracking-widest opacity-50">
                  [Image]
                </div>
              )}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-slate-500 shadow-sm">
                {data.beforeAfter.beforeText}
              </div>
            </div>
            
            {/* After */}
            <div className={cn("relative rounded-2xl overflow-hidden aspect-[4/5] group", data.beforeAfter.imagePlaceholderBg)}>
              {data.beforeAfter.afterImg ? (
                <img src={data.beforeAfter.afterImg} alt="After" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black text-2xl uppercase tracking-widest opacity-50 mix-blend-multiply">
                  [Image]
                </div>
              )}
              <div className="absolute top-4 left-4 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {data.beforeAfter.afterText}
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-black text-[#0A0D14] text-lg">{data.beforeAfter.name}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{data.beforeAfter.age}</p>
                </div>
                <div className="flex items-center gap-1 bg-[#22c55e]/10 text-[#22c55e] px-2 py-1 rounded-md text-xs font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reviews */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-black text-[#0A0D14] mb-2">Exceptional experience is our top priority</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
              <span className="font-bold text-slate-600">4.9/5 Average</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {data.reviews.map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + (i * 0.1) }}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="flex text-amber-400 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed mb-6">"{review.text}"</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="font-black text-sm text-[#0A0D14]">{review.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent z-40">
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 text-center bg-white/80 backdrop-blur px-4 py-1.5 rounded-full shadow-sm">
              Final Step: Medical Questionnaire
            </p>
            <Link to={`/patient/shop?condition=${condition}`} className="w-full">
              <Button className="w-full h-16 rounded-full bg-[#0A0D14] text-white hover:bg-slate-800 font-bold text-lg shadow-2xl shadow-slate-900/20 group">
                Begin Free Consultation
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
