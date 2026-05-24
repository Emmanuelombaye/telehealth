import { Link } from "react-router";
import { ArrowRight, BookOpen, FlaskConical, HelpCircle } from "lucide-react";
import { Reveal } from "../components/ui/Reveal";

const posts = [
  {
    title: "Clinical research behind GLP-1 weight management",
    excerpt: "How STEP and SURMOUNT trial data informs our semaglutide and tirzepatide protocols.",
    to: "/clinical-research",
    icon: FlaskConical,
    tag: "Clinical",
  },
  {
    title: "How Peak Health telehealth works",
    excerpt: "From intake to pharmacy delivery — a step-by-step look at the patient journey.",
    to: "/how-it-works",
    icon: BookOpen,
    tag: "Guide",
  },
  {
    title: "Frequently asked questions",
    excerpt: "Pricing, eligibility, compounded medications, and what to expect from your care team.",
    to: "/faq",
    icon: HelpCircle,
    tag: "FAQ",
  },
];

export function BlogPage() {
  return (
    <div className="bg-white text-[#0A0D14] pt-24 min-h-screen pb-20">
      <section className="py-12 px-6 border-b border-slate-100">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Peak Health Blog</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0A2E1F]">Insights & guides</h1>
            <p className="text-lg text-slate-500 font-medium mt-4 leading-relaxed">
              Clinical education, platform guides, and answers to common patient questions.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-5">
          {posts.map((post, i) => (
            <Reveal key={post.to} delay={i * 0.08}>
              <Link
                to={post.to}
                className="group flex gap-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-emerald-100 hover:shadow-md transition-all no-underline"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <post.icon className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{post.tag}</span>
                  <h2 className="text-lg font-bold text-[#0A2E1F] mt-1 mb-2 group-hover:text-emerald-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 m-0 leading-relaxed">{post.excerpt}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 shrink-0 self-center transition-colors" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
