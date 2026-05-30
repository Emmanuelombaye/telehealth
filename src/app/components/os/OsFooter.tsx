import { Link } from "react-router";
import { AFFILIATE_LOGIN_PATH } from "./constants";
import { MARKETING_PORTAL_LINKS } from "../../../lib/portalLinks";

const platformLinks = [
  { label: "Infrastructure", href: "#how-it-works" },
  { label: "Intake Engine", href: "#platform" },
  { label: "E-Pharmacy", href: "#security" },
  { label: "Affiliates", href: AFFILIATE_LOGIN_PATH, isRoute: true },
] as const;

/** Footer labels match live site; platform items scroll to homepage sections. */
export function OsFooter() {
  return (
    <footer className="py-20 px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <img src="/logo/portal-logo.png" alt="Logo" className="w-40" />
          </Link>
          <p className="text-sm text-slate-400 max-w-xs font-light leading-relaxed">
            The definitive infrastructure for specialized medical care and performance protocols.
            HIPAA compliant, physician led, and pharmacy integrated.
          </p>
        </div>

        <div className="space-y-6">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
            Platform
          </h5>
          <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            {platformLinks.map((item) => (
              <li key={item.label}>
                {"isRoute" in item && item.isRoute ? (
                  <Link to={item.href} className="hover:text-emerald-600 transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <a href={item.href} className="hover:text-emerald-600 transition-colors">
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
            Portals
          </h5>
          <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            {MARKETING_PORTAL_LINKS.map((item) => (
              <li key={item.label}>
                <Link to={item.href} className="hover:text-emerald-600 transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
            Compliance
          </h5>
          <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <li>
              <a href="#security" className="hover:text-emerald-600 transition-colors">
                HIPAA Security
              </a>
            </li>
            <li className="hover:text-emerald-600 cursor-pointer">Privacy Policy</li>
            <li className="hover:text-emerald-600 cursor-pointer">Terms of Service</li>
            <li className="hover:text-emerald-600 cursor-pointer">Clinical Safety</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-20 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">
          © 2026 Peak Health Platform. All rights reserved. Clinical Grade Infrastructure.
        </p>
        <div className="flex items-center gap-4">
          <div className="h-px w-8 bg-slate-200" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            v2.4.0 Stable
          </span>
        </div>
      </div>
    </footer>
  );
}
