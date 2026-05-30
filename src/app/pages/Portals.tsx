import { Link } from "react-router";
import { ArrowRight, Lock } from "lucide-react";
import { MARKETING_PORTAL_LINKS, PORTAL_LOGINS } from "../../lib/portalLinks";

export function PortalsPage() {
  return (
    <div className="min-h-[70vh] py-24 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-600">
            Peak Health OS
          </p>
          <h1 className="text-4xl md:text-5xl font-serif text-emerald-950 tracking-tight">
            Portal access
          </h1>
          <p className="text-slate-500 font-light text-lg max-w-xl mx-auto">
            Sign in with your assigned demo account, or create a new patient account from{" "}
            <Link to={PORTAL_LOGINS.patient} className="text-emerald-700 font-semibold hover:underline">
              patient login
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {MARKETING_PORTAL_LINKS.map((portal) => (
            <Link
              key={portal.href}
              to={portal.href}
              className="group flex flex-col gap-3 rounded-[1.75rem] border border-slate-200/80 bg-white p-8 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-widest text-emerald-950">
                  {portal.label}
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
              <p className="text-sm text-slate-500 font-light leading-relaxed">{portal.description}</p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 mt-auto">
                <Lock className="h-3 w-3" />
                Sign in
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
