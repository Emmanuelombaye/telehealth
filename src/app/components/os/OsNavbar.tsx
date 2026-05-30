import { useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { REGISTER_PATH } from "./constants";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Infrastructure", href: "#how-it-works" },
  { label: "Security", href: "#security" },
] as const;

export function OsNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full sticky top-0 z-50 backdrop-blur-md bg-[#f8f9fa]/80 border-b border-slate-200/40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <img src="/logo/portal-logo.png" alt="Logo" className="w-36 sm:w-40" />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-700 transition-colors px-4"
          >
            Login
          </Link>
          <Link
            to={REGISTER_PATH}
            className="inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] duration-200 py-2 bg-emerald-900 text-emerald-50 rounded-full px-6 h-10 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-sm hover:shadow-md"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200/60 bg-[#f8f9fa] px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-emerald-700"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/login"
            className="block text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-emerald-700 pt-2"
            onClick={() => setMobileOpen(false)}
          >
            Login
          </Link>
          <Link
            to={REGISTER_PATH}
            className="inline-flex w-full items-center justify-center bg-emerald-900 text-emerald-50 rounded-full px-6 h-11 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-800"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
