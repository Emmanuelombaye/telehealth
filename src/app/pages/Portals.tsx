import { Link } from "react-router";
import { ArrowRight, Lock } from "lucide-react";
import { MARKETING_PORTAL_LINKS, PORTAL_LOGINS } from "../../lib/portalLinks";

const pharmacyPortal = {
  label: "Pharmacy Portal",
  href: "/pharmacy/login",
  description: "Fulfillment, compounding, shipping, and inventory",
};

/** Staff/partner entry hub — connects the marketing site to working portal logins. */
export function PortalsPage() {
  const portals = [...MARKETING_PORTAL_LINKS, pharmacyPortal];

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
            The homepage is marketing. Each portal below is the live app — sign in with your
            assigned role. Patient enrollment starts from{" "}
            <Link to="/auth/register" className="text-emerald-700 font-semibold hover:underline">
              Get Started
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {portals.map((portal) => (
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
              {"description" in portal && portal.description && (
                <p className="text-sm text-slate-500 font-light leading-relaxed">
                  {portal.description}
                </p>
              )}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 mt-auto">
                <Lock className="h-3 w-3" />
                Sign in
              </span>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400">
          Patient quick login:{" "}
          <Link to={PORTAL_LOGINS.patient} className="text-emerald-700 font-semibold hover:underline">
            {PORTAL_LOGINS.patient}
          </Link>
        </p>
      </div>
    </div>
  );
}
