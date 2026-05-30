import { Link } from "react-router";
import { PORTAL_LOGINS } from "../../../lib/portalLinks";

export function OsFooter() {
  return (
    <footer className="py-20 px-6 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <img src="/logo/portal-logo.png" alt="Logo" className="w-40" />
          </div>
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
            <li className="hover:text-emerald-600 cursor-pointer">Infrastructure</li>
            <li className="hover:text-emerald-600 cursor-pointer">Intake Engine</li>
            <li className="hover:text-emerald-600 cursor-pointer">E-Pharmacy</li>
            <li>
              <Link to={PORTAL_LOGINS.affiliate} className="hover:text-emerald-600">
                Affiliates
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
            Compliance
          </h5>
          <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <li className="hover:text-emerald-600 cursor-pointer">HIPAA Security</li>
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
