import { Link } from "react-router";
import { Reveal } from "../ui/Reveal";

export type LegalSection = {
  id?: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

type LegalDocumentPageProps = {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalDocumentPage({ title, subtitle, lastUpdated, sections }: LegalDocumentPageProps) {
  return (
    <div className="bg-white text-[#0A0D14] pt-24 min-h-screen pb-20">
      <section className="py-12 px-6 border-b border-slate-100">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Peak Health, Inc.</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0A2E1F]">{title}</h1>
            {subtitle ? (
              <p className="text-lg text-slate-500 font-medium mt-4 leading-relaxed">{subtitle}</p>
            ) : null}
            <p className="text-sm text-slate-400 mt-6">Last updated: {lastUpdated}</p>
          </Reveal>
        </div>
      </section>

      <article className="px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-10">
          {sections.map((section) => (
            <section key={section.id ?? section.heading} id={section.id} className="scroll-mt-28">
              <h2 className="text-xl font-bold text-[#0A2E1F] mb-4">{section.heading}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p.slice(0, 48)} className="text-slate-600 leading-relaxed mb-4">
                  {p}
                </p>
              ))}
              {section.list?.length ? (
                <ul className="list-disc pl-6 space-y-2 text-slate-600 leading-relaxed">
                  {section.list.map((item) => (
                    <li key={item.slice(0, 48)}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>

      <div className="px-6 max-w-3xl mx-auto pt-4 border-t border-slate-100">
        <p className="text-sm text-slate-500">
          Questions? Contact{" "}
          <a href="mailto:support@peak-health.io" className="text-emerald-700 font-semibold hover:underline">
            support@peak-health.io
          </a>
          . See also{" "}
          <Link to="/terms" className="text-emerald-700 font-semibold hover:underline">
            Terms of Service
          </Link>
          ,{" "}
          <Link to="/privacy" className="text-emerald-700 font-semibold hover:underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link to="/support-hub" className="text-emerald-700 font-semibold hover:underline">
            Support Hub
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
