import { Link } from "react-router";
import { User, Stethoscope, ShieldCheck, ArrowRight, Activity, Globe, Star, CheckCircle2, Video, Lock, Zap, Pill, Building2, HeartPulse, Share2 } from "lucide-react";
import { Card, CardContent, Button, cn } from "../components/ui/shared";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useI18n, LOCALES } from "../../lib";

export function LandingPage() {
  const { t, locale, setLocale } = useI18n();

  const portals = [
    {
      title: t("portal.patient"),
      description: t("portal.patient.desc"),
      icon: User,
      href: "/patient",
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      image: "https://images.unsplash.com/photo-1511174511562-5f7f18bf270b?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: t("portal.doctor"),
      description: t("portal.doctor.desc"),
      icon: Stethoscope,
      href: "/doctor",
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: t("portal.admin"),
      description: t("portal.admin.desc"),
      icon: ShieldCheck,
      href: "/admin",
      gradient: "from-slate-600 to-slate-700",
      bg: "bg-slate-50 dark:bg-slate-950/30",
      image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Pharmacy Portal",
      description: "Manage prescriptions, inventory, and fulfillment.",
      icon: Pill,
      href: "/pharmacy",
      gradient: "from-teal-500 to-teal-600",
      bg: "bg-teal-50 dark:bg-teal-950/30",
      image: "https://images.unsplash.com/photo-1563213126-a4273aed2016?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Insurance Portal",
      description: "Process claims, verify coverage, and manage billing.",
      icon: Building2,
      href: "/insurance",
      gradient: "from-blue-600 to-blue-700",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Nurse Triage",
      description: "Pre-consultation interviews and patient queue management.",
      icon: HeartPulse,
      href: "/nurse",
      gradient: "from-pink-500 to-pink-600",
      bg: "bg-pink-50 dark:bg-pink-950/30",
      image: "https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Corporate Portal",
      description: "B2B portal for employee wellness and benefits.",
      icon: Building2,
      href: "/corporate",
      gradient: "from-indigo-600 to-indigo-700",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    },
    {
      title: "Affiliate Portal",
      description: "Track referrals, share records, and manage commissions.",
      icon: Share2,
      href: "/affiliate",
      gradient: "from-orange-500 to-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
    },
  ];

  const stats = [
    { value: "2.4M+", label: t("landing.stats.patients") },
    { value: "18K+", label: t("landing.stats.doctors") },
    { value: "120+", label: t("landing.stats.countries") },
    { value: "99.9%", label: t("landing.stats.uptime") },
  ];

  const features = [
    { icon: Video, title: "HD Video Consultations", desc: "Crystal-clear video calls with automatic bandwidth adaptation." },
    { icon: Lock, title: "HIPAA-Grade Security", desc: "End-to-end encryption, audit logs, and zero-trust architecture." },
    { icon: Globe, title: "6 Languages", desc: "Full RTL support for Arabic, plus EN, ES, FR, ZH, PT." },
    { icon: Zap, title: "Instant Matching", desc: "AI-powered doctor matching in under 60 seconds." },
    { icon: Activity, title: "Real-time Vitals", desc: "Connect wearables and monitor health metrics live." },
    { icon: CheckCircle2, title: "Verified Doctors", desc: "Every doctor is board-certified and background-checked." },
  ];

  const testimonials = [
    { name: "Maria G.", country: "🇪🇸 Spain", text: "I got a specialist consultation in 10 minutes. Incredible platform.", rating: 5 },
    { name: "Ahmed K.", country: "🇸🇦 Saudi Arabia", text: "الواجهة العربية ممتازة والأطباء محترفون جداً.", rating: 5 },
    { name: "Liu W.", country: "🇨🇳 China", text: "界面简洁，医生专业，预约非常方便。", rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base">Brandon Health</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language quick-switch */}
            <div className="hidden sm:flex items-center gap-1">
              {LOCALES.map(l => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className={cn(
                    "text-sm px-2 py-1 rounded-lg transition-colors",
                    locale === l.code ? "bg-primary text-white font-semibold" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  {l.flag}
                </button>
              ))}
            </div>
            <Link to="/patient">
              <Button size="sm" className="rounded-full">{t("landing.cta")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 pt-16 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Globe className="h-3.5 w-3.5" />
            Available in {LOCALES.length} languages worldwide
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary via-blue-500 to-emerald-500 bg-clip-text text-transparent leading-tight">
            {t("landing.hero")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("landing.sub")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/patient">
              <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/30 w-full sm:w-auto">
                {t("landing.cta")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating stats */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Choose Your Portal</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {portals.map((portal) => (
            <Link key={portal.href} to={portal.href} className="group">
              <Card className="h-full overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="h-44 overflow-hidden relative">
                  <ImageWithFallback
                    src={portal.image}
                    alt={portal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={cn("absolute inset-0 bg-gradient-to-t", `${portal.gradient} opacity-20`)} />
                </div>
                <CardContent className="p-5">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 bg-gradient-to-br", portal.gradient)}>
                    <portal.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{portal.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{portal.description}</p>
                  <div className="flex items-center text-primary text-sm font-semibold">
                    Enter Portal <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/40 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Enterprise-Grade Features</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Trusted Globally</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.country}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-primary to-blue-600 py-14 px-4 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to transform healthcare?</h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">Join 2.4 million patients and 18,000 doctors on the world's most advanced telehealth platform.</p>
        <Link to="/patient">
          <Button size="lg" variant="secondary" className="rounded-full px-8 font-bold">
            {t("landing.cta")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Brandon Health</span>
        </div>
        <p>© {new Date().getFullYear()} Brandon Health. HIPAA-compliant. Available in {LOCALES.length} languages.</p>
      </footer>
    </div>
  );
}
