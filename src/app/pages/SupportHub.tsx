import { motion } from "framer-motion";
import { 
  ShieldCheck, HelpCircle, Mail, Briefcase, 
  Share2, Newspaper, Lock, Info, Heart, Scale
} from "lucide-react";
import { Link } from "react-router";
import { Button, Card, CardContent, Badge, cn } from "../components/ui/shared.tsx";
import { Reveal } from "../components/ui/Reveal";
import { PORTAL_LOGINS } from "../../lib/portalLinks";

export function SupportHubPage() {
  const sections = [
    {
      group: "Compliance",
      links: [
        { title: "Patient Bill of Rights", icon: Heart, desc: "Your rights and protections as a Peak Health patient." },
        { title: "HIPAA Compliance", icon: Lock, desc: "How we protect your sensitive medical data." },
        { title: "Anti-Discrimination Policy", icon: Scale, desc: "Our commitment to equitable care for all." },
      ]
    },
    {
      group: "Corporate",
      links: [
        { title: "Careers", icon: Briefcase, desc: "Join our team of medical and tech innovators." },
        { title: "Press & Media", icon: Newspaper, desc: "Resources for journalists and news outlets." },
        {
          title: "Affiliate Program",
          icon: Share2,
          desc: "Partner with us to promote clinical wellness.",
          href: PORTAL_LOGINS.affiliate,
        },
      ]
    },
    {
      group: "Support",
      links: [
        { title: "Contact Support", icon: Mail, desc: "Get help with your order or clinical questions." },
        { title: "Clinical FAQ", icon: HelpCircle, desc: "Detailed answers to medical and platform questions." },
        { title: "Safety Information", icon: Info, desc: "Important medication and side-effect data." },
      ]
    }
  ];

  return (
    <div className="bg-white text-[#0A0D14] pt-24 min-h-screen">
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
           <div className="text-center space-y-4">
              <Reveal>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight">Trust & Support Center</h1>
                <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">Everything you need to know about our standards, safety, and support.</p>
              </Reveal>
           </div>

           <div className="grid lg:grid-cols-3 gap-12 pt-12">
              {sections.map((group, idx) => (
                <div key={idx} className="space-y-8">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">{group.group}</h3>
                   <div className="space-y-4">
                      {group.links.map((link, i) => (
                        <Reveal key={i} delay={0.1 * i} direction="up">
                          {"href" in link && link.href ? (
                            <Link to={link.href} className="block">
                              <Card className="border-2 border-slate-50 hover:border-emerald-500 transition-all cursor-pointer group rounded-[32px]">
                                <CardContent className="p-6 flex gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                                    <link.icon className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="font-black text-[#0A0D14] group-hover:text-emerald-600 transition-colors">
                                      {link.title}
                                    </h4>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{link.desc}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ) : (
                            <Card className="border-2 border-slate-50 hover:border-emerald-500 transition-all cursor-pointer group rounded-[32px]">
                              <CardContent className="p-6 flex gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                                  <link.icon className="h-6 w-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-black text-[#0A0D14] group-hover:text-emerald-600 transition-colors">
                                    {link.title}
                                  </h4>
                                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{link.desc}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Reveal>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center space-y-12">
           <Reveal>
              <h2 className="text-4xl font-black">Still have questions?</h2>
              <p className="text-slate-500 font-medium">Our medical support team is available 24/7.</p>
           </Reveal>
           <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button className="h-16 px-12 rounded-3xl bg-[#0A0D14] text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-900/20">
                 Message Clinical Support
              </Button>
              <Button variant="outline" className="h-16 px-12 rounded-3xl border-2 border-slate-200 font-black uppercase text-xs tracking-widest hover:bg-white">
                 View Knowledge Base
              </Button>
           </div>
        </div>
      </section>
    </div>
  );
}
