import { Link } from "react-router";

export function LandingFooter() {
  return (
    <footer className="bg-[#0a0d14] text-slate-400 pt-16 pb-10 px-6 text-sm">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <h4 className="text-white font-bold mb-4 text-base">Peak Health</h4>
            <p className="leading-relaxed">The executive standard for biological optimization and clinical telemedicine.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Treatments</h4>
            <div className="flex flex-col gap-3">
              <Link to="/explore-treatments" className="text-slate-400 no-underline hover:text-white transition-colors">Weight Management</Link>
              <Link to="/explore-treatments" className="text-slate-400 no-underline hover:text-white transition-colors">Longevity & NAD+</Link>
              <Link to="/explore-treatments" className="text-slate-400 no-underline hover:text-white transition-colors">Muscle Recovery</Link>
              <Link to="/explore-treatments" className="text-slate-400 no-underline hover:text-white transition-colors">Hair Restoration</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Company</h4>
            <div className="flex flex-col gap-3">
              <Link to="/how-it-works" className="text-slate-400 no-underline hover:text-white transition-colors">How It Works</Link>
              <Link to="/faq" className="text-slate-400 no-underline hover:text-white transition-colors">FAQ</Link>
              <Link to="/support" className="text-slate-400 no-underline hover:text-white transition-colors">Support Hub</Link>
              <Link to="/patient/login" className="text-slate-400 no-underline hover:text-white transition-colors">Patient Portal</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-[15px]">Legal</h4>
            <div className="flex flex-col gap-3">
              <Link to="/terms" className="text-slate-400 no-underline hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="text-slate-400 no-underline hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/refund" className="text-slate-400 no-underline hover:text-white transition-colors">Refund Policy</Link>
              <Link to="/shipping" className="text-slate-400 no-underline hover:text-white transition-colors">Shipping Policy</Link>
              <Link to="/llms" className="text-slate-400 no-underline hover:text-white transition-colors">LLMs.txt</Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 px-2 pb-6 text-[13px]">
          <Link to="/llms" className="text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4">LLMs.txt</Link>
          <Link to="/terms" className="text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4">Terms of Service</Link>
          <Link to="/privacy" className="text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4">Privacy Policy</Link>
          <Link to="/refund" className="text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4">Refund Policy</Link>
          <Link to="/shipping" className="text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4">Shipping Policy</Link>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row gap-5 justify-between items-center">
          <p className="m-0 text-center md:text-left">© {new Date().getFullYear()} Peak Health. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="text-xs font-extrabold px-3 py-1.5 bg-slate-800 rounded-md text-white tracking-wider">HIPAA COMPLIANT</span>
            <span className="text-xs font-extrabold px-3 py-1.5 bg-slate-800 rounded-md text-white tracking-wider">LEGIT SCRIPT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
