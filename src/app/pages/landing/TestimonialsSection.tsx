import { Link } from "react-router";
import { Star } from "lucide-react";

const reviews = [
  { quote:"I lost 38 lbs in 4 months. The process was seamless — questionnaire to delivery in 48 hours. Absolutely life-changing.", author:"Rachel T.", tag:"GLP-1 Patient", rating:5 },
  { quote:"Finally a telehealth platform that actually feels medical. My doctor checked in weekly and adjusted my dose perfectly.", author:"Marcus D.", tag:"Tirzepatide Patient", rating:5 },
  { quote:"The app makes it so easy to track my progress. Lost 22 lbs in 2 months. The support team is incredibly responsive.", author:"Linda K.", tag:"Semaglutide Patient", rating:5 },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-6 bg-[#f7f9fc]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-blue-500 block mb-2">Patient Stories</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0a0d14] tracking-tight m-0">Real results. Real people.</h2>
        </div>

        {/* App mockup + reviews side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-12 items-start">
          {/* Phone */}
          <div className="rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-w-sm mx-auto lg:max-w-none w-full">
            <img src="/generatedImages/image6.png" alt="Peak Health app" className="w-full block" />
          </div>
          {/* Review cards */}
          <div className="flex flex-col gap-4">
            {reviews.map((r,i) => (
              <div key={i} className="bg-white rounded-[20px] p-6 border border-[#e8edf3] shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({length:r.rating}).map((_,j) => <Star key={j} size={14} fill="#f97316" color="#f97316" />)}
                </div>
                <p className="text-[#0a0d14] font-medium text-[15px] leading-relaxed mb-4">"{r.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[11px] font-extrabold text-[#0a0d14] uppercase tracking-widest">{r.author} — {r.tag}</span>
                </div>
              </div>
            ))}
            <Link to="/quiz/select-treatment" className="block text-center bg-[#0d2137] text-white py-4 rounded-full font-bold text-sm no-underline mt-2 hover:bg-slate-800 transition-colors">
              Join Thousands of Patients →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
