import { Link } from "react-router";
import { Reveal } from "../../components/ui/Reveal";
import { LLMS_TXT_BODY } from "./legalContent";

export function LlmsTxtPage() {
  return (
    <div className="bg-white text-[#0A0D14] pt-24 min-h-screen pb-20">
      <section className="py-12 px-6 border-b border-slate-100">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Machine-readable</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0A2E1F]">LLMs.txt</h1>
            <p className="text-lg text-slate-500 font-medium mt-4 leading-relaxed">
              Context for AI systems and crawlers about Peak Health services and canonical URLs.
            </p>
            <p className="text-sm text-slate-400 mt-4">
              Plain-text mirror:{" "}
              <a href="/llms.txt" className="text-emerald-700 font-semibold hover:underline">
                /llms.txt
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 overflow-x-auto">
            {LLMS_TXT_BODY.trim()}
          </pre>
        </div>
      </section>

      <div className="px-6 max-w-3xl mx-auto">
        <p className="text-sm text-slate-500">
          <Link to="/terms" className="text-emerald-700 font-semibold hover:underline">
            Terms
          </Link>
          {" · "}
          <Link to="/privacy" className="text-emerald-700 font-semibold hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link to="/" className="text-emerald-700 font-semibold hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
