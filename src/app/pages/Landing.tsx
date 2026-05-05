import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  ArrowRight, CheckCircle2, Shield, Clock, Star, Activity, 
  Pill, ShieldCheck, User, ChevronDown, ChevronUp, Globe,
  Stethoscope, Users, Award
} from "lucide-react";
import { Button, cn, Card, CardContent } from "../components/ui/shared";

const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const DR_AVATAR = (id: string) => `https://i.pravatar.cc/150?u=${id}`;

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const faqs = [
    { q: "How does the process work?", a: "Simply choose a treatment, complete a medical intake, and pay for your first month. A U.S. licensed provider will review your case within 24 hours. If approved, your medication is shipped to your door." },
    { q: "Is this a subscription?", a: "Yes, our programs are monthly or quarterly. You can pause or cancel at any time directly through your Patient Portal." },
    { q: "Where are the medications sourced?", a: "We only work with U.S.-based, FDA-regulated 503A/503B compounding pharmacies or commercial wholesale distributors." },
    { q: "Do I need an existing prescription?", a: "No. Our network of licensed providers will write a prescription for you if they determine the treatment is medically appropriate based on your intake." }
  ];

  return (
    <div className="min-h-screen bg-[#FDFEFE] font-sans selection:bg-emerald-100">
      {/* 1. Announcement Bar - High Fidelity Marquee */}
      <div className="bg-[#0A0D14] text-white py-2.5 overflow-hidden border-b border-white/10">
        <div className="flex animate-marquee-fast whitespace-nowrap text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center">
              <span className="mx-6">🇺🇸 U.S. Licensed Pharmacies</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
              <span className="mx-6">⚕️ 50-State Provider Network</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
              <span className="mx-6">🔒 HIPAA SECURE PLATFORM</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
              <span className="mx-6">📦 Free Expedited Delivery</span>
              <span className="h-1 w-1 bg-white/30 rounded-full"></span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. Premium Header */}
      <header className={cn("sticky top-0 z-50 transition-all duration-500", 
        scrolled ? "bg-white/90 backdrop-blur-xl border-b border-slate-100 py-3 shadow-sm" : "bg-transparent py-6")}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/PeakHealthLogo.png" alt="Peak Health" className="h-10 object-contain group-hover:scale-105 transition-transform duration-300" />
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {["Treatments", "How It Works", "Medical Team", "Results"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                className="text-[13px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#0A0D14] transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <Link to="/patient" className="hidden sm:block text-[13px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#0A0D14]">
              Sign In
            </Link>
            <Link to="/patient/shop">
              <Button className="rounded-full bg-[#0A0D14] text-white hover:bg-[#1A1D24] px-8 py-6 font-bold text-sm shadow-xl shadow-slate-900/10">
                GET STARTED
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. High-Fidelity Hero */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-[55%] space-y-8 z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Now Prescribing in 50 States
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-[#0A0D14] leading-[0.95] tracking-tight">
              Clinical<br/>
              results for<br/>
              <span className="text-emerald-600 font-serif italic font-medium tracking-normal">your biology.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
              Medical-grade treatments prescribed by U.S. licensed providers. No clinics, no pharmacies, just results.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 pt-4 justify-center lg:justify-start">
              <Link to="/patient/shop">
                <Button size="lg" className="w-full sm:w-auto rounded-full bg-[#0A0D14] text-white h-16 px-10 text-base font-black shadow-2xl shadow-slate-900/20">
                  EXPLORE TREATMENTS <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 grayscale opacity-50">
              <ShieldCheck className="h-10 w-10" />
              <div className="h-8 w-[1px] bg-slate-200" />
              <Globe className="h-10 w-10" />
              <div className="h-8 w-[1px] bg-slate-200" />
              <Award className="h-10 w-10" />
            </div>
          </div>
          <div className="lg:w-[45%] relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-100/40 to-sky-100/40 rounded-[60px] blur-3xl opacity-60" />
            <div className="relative z-10 p-4 bg-white rounded-[50px] shadow-2xl border border-slate-100">
              <img 
                src={IMG("1573496359142-b8d87734a5a2")} 
                alt="Health Hero" 
                className="w-full h-[600px] object-cover rounded-[40px]"
              />
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl border border-slate-50 max-w-[200px] animate-bounce-slow">
                <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Average Results</p>
                <p className="text-2xl font-black text-[#0A0D14]">-15.3%</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Body Weight Loss</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trusted Medical Team (New High-Fidelity Section) */}
      <section id="medical-team" className="py-24 bg-white border-y border-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/3">
              <h2 className="text-4xl font-black text-[#0A0D14] leading-tight mb-4">Trusted by the experts.</h2>
              <p className="text-slate-500 font-medium">Every prescription is reviewed and approved by our board-certified clinical network.</p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F8FBFD] rounded-2xl">
                  <p className="text-2xl font-black text-[#0A0D14]">50+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinicians</p>
                </div>
                <div className="p-4 bg-[#F8FBFD] rounded-2xl">
                  <p className="text-2xl font-black text-[#0A0D14]">100%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">U.S. Licensed</p>
                </div>
              </div>
            </div>
            <div className="md:w-2/3 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { name: "Dr. Aris T.", role: "Endocrinology", id: "1" },
                { name: "Dr. Sarah L.", role: "Ob/Gyn", id: "2" },
                { name: "Dr. Marcus K.", role: "Primary Care", id: "3" },
                { name: "Dr. Elena J.", role: "Dermatology", id: "4" },
              ].map((dr) => (
                <div key={dr.id} className="text-center group">
                  <div className="relative mb-4 inline-block">
                    <img src={DR_AVATAR(dr.id)} alt={dr.name} className="h-32 w-32 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 object-cover border-4 border-white shadow-lg" />
                    <div className="absolute inset-0 rounded-full border border-[#0A0D14]/5" />
                  </div>
                  <p className="font-black text-[#0A0D14] text-sm">{dr.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dr.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Treatment Catalog */}
      <section id="treatments" className="py-32 bg-[#F8FBFD]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-[#0A0D14] mb-4">Precision Medicine.</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Skip the pharmacy. Skip the waiting room. Get clinical treatments shipped to your door.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { cat: "METABOLIC HEALTH", name: "GLP-1 Program", price: "$199/mo", img: IMG("1505576399279-565b52d4ac71"), tags: ["Semaglutide", "Tirzepatide"] },
              { cat: "SEXUAL WELLNESS", name: "ED Protocol", price: "$2/dose", img: IMG("1631549916768-4119b2e5f926"), tags: ["Sildenafil", "Tadalafil"] },
              { cat: "HORMONE OPTIMIZATION", name: "TRT Program", price: "$249/mo", img: IMG("1559757175-5700dde675bc"), tags: ["Injections", "Labs Included"] },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-[40px] overflow-hidden border border-slate-100 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 group">
                <div className="h-80 overflow-hidden relative">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                    <div className="flex gap-2">
                      {p.tags.map(t => <span key={t} className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white uppercase">{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-[10px] font-black text-emerald-600 tracking-[0.2em] mb-2 uppercase">{p.cat}</p>
                  <h3 className="text-3xl font-black text-[#0A0D14] mb-6">{p.name}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Starting at</p>
                      <p className="text-xl font-black text-[#0A0D14]">{p.price}</p>
                    </div>
                    <Link to="/patient/shop">
                      <Button className="rounded-full bg-[#0A0D14] text-white hover:bg-[#1A1D24] px-6 h-12 font-black uppercase text-xs tracking-widest">
                        SELECT
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. How It Works — Premium Animated Section */}
      <section id="how-it-works" className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-100 mb-6">
              <CheckCircle2 className="h-3 w-3" /> Simple Process
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-[#0A0D14] leading-[0.95]">
              From click to <span className="text-emerald-600 font-serif italic font-medium">clinic.</span>
            </h2>
            <p className="text-slate-500 text-lg mt-4 max-w-xl mx-auto">Four steps. No waiting rooms. No phone calls. Just results.</p>
          </div>

          {/* Connected Timeline */}
          <div className="relative">
            {/* Horizontal connector line (desktop) */}
            <div className="hidden md:block absolute top-[72px] left-[10%] right-[10%] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300 rounded-full animate-pulse opacity-40" />
            </div>

            <div className="grid md:grid-cols-4 gap-8 md:gap-6 relative z-10">
              {[
                { 
                  step: "01", 
                  title: "Choose Treatment", 
                  desc: "Browse our catalog of clinically-vetted protocols. Select what fits your biology.", 
                  icon: Pill,
                  color: "from-emerald-400 to-emerald-600",
                  bg: "bg-emerald-50",
                  delay: "0ms"
                },
                { 
                  step: "02", 
                  title: "Medical Intake", 
                  desc: "Answer a quick, product-specific medical questionnaire reviewed by our AI pre-screener.", 
                  icon: Stethoscope,
                  color: "from-blue-400 to-blue-600",
                  bg: "bg-blue-50",
                  delay: "150ms"
                },
                { 
                  step: "03", 
                  title: "Pay & Verify", 
                  desc: "Secure checkout with Stripe. Create your HIPAA-compliant account with 2FA identity verification.", 
                  icon: Shield,
                  color: "from-violet-400 to-violet-600",
                  bg: "bg-violet-50",
                  delay: "300ms"
                },
                { 
                  step: "04", 
                  title: "Get Treatment", 
                  desc: "A U.S. licensed provider reviews within 24hrs. If approved, medication ships free to your door.", 
                  icon: ArrowRight,
                  color: "from-amber-400 to-orange-500",
                  bg: "bg-amber-50",
                  delay: "450ms"
                },
              ].map((s, i) => (
                <div 
                  key={i} 
                  className="group relative"
                  style={{ animationDelay: s.delay }}
                >
                  {/* Step Circle */}
                  <div className="flex justify-center mb-8">
                    <div className={cn("relative h-[88px] w-[88px] rounded-full bg-gradient-to-br shadow-lg flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl transition-all duration-500", s.color)}>
                      <s.icon className="h-8 w-8 text-white" />
                      <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-[#0A0D14] text-white text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white">
                        {s.step}
                      </div>
                      {/* Pulse ring */}
                      <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-30 group-hover:scale-150 transition-all duration-700", s.color)} />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={cn("p-6 rounded-3xl border border-slate-100 text-center group-hover:border-slate-200 group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-500", s.bg)}>
                    <h3 className="text-xl font-black text-[#0A0D14] mb-3">{s.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <Link to="/patient/shop">
              <Button size="lg" className="rounded-full bg-[#0A0D14] text-white hover:bg-[#1A1D24] h-14 px-10 text-sm font-black shadow-xl shadow-slate-900/10 group">
                START YOUR JOURNEY <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="mt-4 text-xs text-slate-400 font-medium">No appointments needed · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* 7. Results Section */}
      <section id="results" className="py-32 bg-[#0A0D14] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-4">Your results.</h2>
            <p className="text-slate-400 text-lg">Real data from real Peak Health patients.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { val: "-18%", label: "Average Body Weight Loss", sub: "Over 6-12 months" },
              { val: "94%", label: "Patient Satisfaction", sub: "Verified reviews" },
              { val: "100k+", label: "Treatments Delivered", sub: "Nationwide" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-8 bg-white/5 rounded-[40px] border border-white/10">
                <p className="text-6xl font-black text-emerald-400 mb-4">{stat.val}</p>
                <p className="text-xl font-bold mb-1">{stat.label}</p>
                <p className="text-sm text-slate-500 font-medium">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ Section (High Fidelity) */}
      <section className="py-32 bg-[#F8FBFD]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-black text-[#0A0D14] text-center mb-16">Common Questions.</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <button key={i} onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full text-left bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#0A0D14]">{f.q}</span>
                  {activeFaq === i ? <ChevronUp className="h-5 w-5 text-emerald-600" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
                {activeFaq === i && (
                  <p className="mt-4 text-slate-500 font-medium leading-relaxed animate-in fade-in slide-in-from-top-2">
                    {f.a}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-emerald-600 rounded-[60px] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl -ml-48 -mb-48" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-5xl md:text-7xl font-black leading-none">Ready for your peak?</h2>
            <p className="text-xl text-emerald-50 font-medium">Join 100,000+ patients who have transformed their health with our clinical protocols.</p>
            <Link to="/patient/shop">
              <Button size="lg" className="rounded-full bg-white text-emerald-600 hover:bg-emerald-50 h-18 px-12 text-lg font-black shadow-2xl">
                START YOUR JOURNEY
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. High Fidelity Footer */}
      <footer className="bg-[#0A0D14] text-slate-500 py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <img src="/PeakHealthLogo.png" alt="Peak Health" className="h-12 object-contain brightness-0 invert" />
            </div>
            <p className="max-w-sm mb-10 leading-relaxed font-medium">
              Medical-grade wellness protocols delivered to your door. The future of healthcare is <span className="text-emerald-400 font-serif italic">personalized.</span>
            </p>
            <div className="flex items-center gap-6 grayscale opacity-40">
              <ShieldCheck className="h-8 w-8" />
              <Award className="h-8 w-8" />
              <Users className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs mb-8">Treatments</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/patient/shop" className="hover:text-emerald-400 transition-colors">Weight Loss</Link></li>
              <li><Link to="/patient/shop" className="hover:text-emerald-400 transition-colors">Men's Health</Link></li>
              <li><Link to="/patient/shop" className="hover:text-emerald-400 transition-colors">Longevity</Link></li>
              <li><Link to="/patient/shop" className="hover:text-emerald-400 transition-colors">Dermatology</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-xs mb-8">Navigation</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/patient" className="hover:text-emerald-400 transition-colors">Patient Portal</Link></li>
              <li><Link to="/doctor" className="hover:text-emerald-400 transition-colors">Doctor Portal</Link></li>
              <li><Link to="/admin" className="hover:text-emerald-400 transition-colors">Admin Dashboard</Link></li>
              <li><Link to="/superadmin" className="hover:text-emerald-400 transition-colors">Super Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 text-[10px] uppercase font-black tracking-widest text-center">
          <p>© {new Date().getFullYear()} PEAK HEALTH TECHNOLOGY GROUP LLC. All rights reserved.</p>
          <p className="mt-8 opacity-40 leading-loose max-w-4xl mx-auto tracking-normal font-medium">
            *DISCLAIMER: The information provided on this site is not a substitute for professional medical advice. Always consult your physician before beginning any treatment program. Prescriptions are provided at the sole discretion of the treating provider.
          </p>
        </div>
      </footer>
    </div>
  );
}
