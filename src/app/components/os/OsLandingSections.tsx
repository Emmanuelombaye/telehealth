import { Link } from "react-router";
import {
  ArrowRight,
  ChevronRight,
  Database,
  Globe,
  Lock,
  Plus,
  Stethoscope,
  Truck,
  Zap,
} from "lucide-react";
import {
  BRAND_LOGOS,
  CLINICAL_FLOW_STEPS,
  PLATFORM_FEATURES,
  REGISTER_PATH,
} from "./constants";

function PlatformIcon({ type }: { type: (typeof PLATFORM_FEATURES)[number]["icon"] }) {
  const className = "h-6 w-6";
  if (type === "zap") return <Zap className={className} />;
  if (type === "stethoscope") return <Stethoscope className={className} />;
  return <Database className={className} />;
}

function BrandLogoRow({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex items-center gap-16 px-4 shrink-0"
      aria-hidden={ariaHidden || undefined}
    >
      {BRAND_LOGOS.map((logo) => (
        <div
          key={`${ariaHidden ? "dup-" : ""}${logo.title}`}
          className="flex items-center justify-center h-10 opacity-40 hover:opacity-100 grayscale hover:grayscale-0 hover:-translate-y-0.5 transition-all duration-300 shrink-0"
          title={logo.title}
        >
          <img
            src={logo.src}
            alt={logo.alt}
            className="max-h-full max-w-[120px] object-contain block"
          />
        </div>
      ))}
    </div>
  );
}

export function OsLandingSections() {
  return (
    <>
      <section className="relative pt-20 pb-24 overflow-hidden px-6">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif leading-[1.15] tracking-tight text-emerald-950">
            Your Clinical Vision. <br />
            <span className="italic text-emerald-600">Our Infrastructure.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-light leading-relaxed">
            Peak Health provides the backend power for modern medical brands. From secure
            intakes to automated pharmacy fulfillment, we handle the complexity so you can
            focus on care.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to={REGISTER_PATH}
              className="inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 h-14 px-10 rounded-full bg-emerald-900 text-white text-sm font-bold group w-full sm:w-auto"
            >
              Launch Your Consultation
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background duration-200 hover:-translate-y-0.5 active:scale-[0.98] py-2 h-14 px-10 rounded-full text-slate-500 font-bold text-sm hover:bg-emerald-50 hover:text-emerald-900 transition-all w-full sm:w-auto"
            >
              View Demo Portal
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 pt-8 border-t border-slate-200/60 max-w-2xl mx-auto">
            <div className="text-center px-4">
              <p className="text-2xl font-serif font-bold text-emerald-900">HIPAA</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                Compliant
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block" />
            <div className="text-center px-4">
              <p className="text-2xl font-serif font-bold text-emerald-900">24/7</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                Clinical Support
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block" />
            <div className="text-center px-4">
              <p className="text-2xl font-serif font-bold text-emerald-900">Fast</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                Fulfillment
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 border-y border-slate-200/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="w-full overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
              <BrandLogoRow />
              <BrandLogoRow ariaHidden />
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="py-32 bg-white scroll-mt-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl md:text-6xl font-serif text-emerald-950 tracking-tight">
              The Platform for{" "}
              <span className="italic text-emerald-600">Specialized Care.</span>
            </h2>
            <p className="text-slate-500 font-light text-lg max-w-2xl mx-auto">
              We&apos;ve abstracted the entire clinical journey into a single, cohesive
              infrastructure.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLATFORM_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-2 overflow-hidden border group border-transparent bg-slate-50/50 hover:bg-white transition-all duration-500 rounded-[2rem] p-8"
              >
                <div className="p-0 space-y-6">
                  <div
                    className={`${feature.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}
                  >
                    <PlatformIcon type={feature.icon} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-emerald-950">{feature.title}</h3>
                    <p className="text-sm text-slate-500 font-light leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center text-xs font-bold uppercase tracking-widest text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn More <ChevronRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="py-32 bg-emerald-950 text-white rounded-[4rem] mx-4 overflow-hidden relative scroll-mt-28"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-900/20 blur-[120px] -z-0 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-4xl md:text-6xl font-serif leading-tight tracking-tight">
                Abstracted <br />
                <span className="italic text-emerald-400">Clinical Flow.</span>
              </h2>
              <p className="text-lg text-emerald-100/60 font-light leading-relaxed">
                Our infrastructure automates the critical path from patient onboarding to
                pharmaceutical delivery.
              </p>
              <div className="space-y-8">
                {CLINICAL_FLOW_STEPS.map((item) => (
                  <div key={item.step} className="flex items-start gap-6 group">
                    <div className="text-2xl font-serif font-black text-emerald-800 group-hover:text-emerald-400 transition-colors">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg tracking-tight">{item.title}</h4>
                      <p className="text-sm text-emerald-100/50 font-light">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to={REGISTER_PATH}
                className="inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 py-2 bg-emerald-400 text-emerald-950 hover:bg-emerald-300 rounded-full px-8 h-12 text-xs font-bold uppercase tracking-widest mt-8"
              >
                Explore Intake Portal
              </Link>
            </div>

            <div id="security" className="grid grid-cols-1 sm:grid-cols-2 gap-4 scroll-mt-28">
              <div className="space-y-4 sm:pt-12">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl space-y-4">
                  <Lock className="h-8 w-8 text-emerald-400" />
                  <h5 className="font-bold">E2E Encryption</h5>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-black">
                    Secure Core
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl space-y-4">
                  <Globe className="h-8 w-8 text-emerald-400" />
                  <h5 className="font-bold">National Network</h5>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-black">
                    50 States
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl space-y-4">
                  <Truck className="h-8 w-8 text-emerald-400" />
                  <h5 className="font-bold">E-Pharmacy</h5>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-black">
                    Direct Sync
                  </p>
                </div>
                <div className="bg-emerald-400 p-6 rounded-3xl space-y-4 text-emerald-950">
                  <Plus className="h-8 w-8" />
                  <h5 className="font-bold">Affiliate Hub</h5>
                  <p className="text-[10px] text-emerald-900/60 leading-relaxed uppercase tracking-widest font-black">
                    Growth Ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-12 md:p-20 text-center border border-slate-200/50 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10" />
          <div className="space-y-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-serif text-emerald-950">
              Ready to scale your{" "}
              <span className="italic text-emerald-600">Clinical Protocol?</span>
            </h2>
            <p className="text-slate-500 font-light text-lg">
              Join the modern platform for specialized telehealth. Start your clinical journey
              today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to={REGISTER_PATH}
                className="inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 h-16 px-12 rounded-full bg-emerald-900 text-white text-base font-bold group"
              >
                Launch Now
              </Link>
              <Link
                to="/login"
                className="text-xs font-black uppercase tracking-widest px-8 py-3 text-slate-400 hover:text-emerald-900 transition-all"
              >
                Speak to a Platform Specialist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
